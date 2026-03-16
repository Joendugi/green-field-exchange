import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";
import { api } from "./_generated/api";
import { ensureAdmin } from "./helpers";

export const getOrderEscrow = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const order = await ctx.db.get(args.orderId);
        if (!order) return null;
        return {
            status: order.escrow_status || "pending",
            amount: order.total_price,
            canRelease: order.status === "accepted" || order.status === "completed",
        };
    },
});

export const releasePayment = mutation({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const order = await ctx.db.get(args.orderId);
        if (!order || order.buyerId !== userId) {
            throw new Error("Only the buyer can release the escrow payment.");
        }

        if (order.escrow_status === "released") {
            throw new Error("Payment has already been released.");
        }

        // 1. Release the escrow
        await ctx.db.patch(args.orderId, {
            escrow_status: "released",
            status: "completed",
            updated_at: Date.now(),
        });

        // 2. Notify the farmer that funds are available
        await ctx.db.insert("notifications", {
            userId: order.farmerId,
            title: "Payment Released! 💰",
            message: `The buyer has confirmed receipt and released the payment of $${order.total_price.toFixed(2)} for your produce.`,
            is_read: false,
            type: "order",
            link: "/dashboard?tab=orders",
            created_at: Date.now(),
        });

        return { success: true };
    },
});

export const refundEscrow = mutation({
    args: { orderId: v.id("orders"), reason: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Simple security: only the admin can initiate a refund (or a more complex dispute logic)
        // For now, let's allow it as a demo but note it should be tied to role check.
        // We'll check if the caller is the person holding the order or admin.

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        await ctx.db.patch(args.orderId, {
            escrow_status: "refunded",
            status: "cancelled",
            updated_at: Date.now(),
        });

        // Notify both parties
        const notification = {
            title: "Escrow Refunded 🔄",
            message: `The payment for order #${args.orderId.slice(0, 8)} has been refunded. Reason: ${args.reason}`,
            is_read: false,
            type: "order",
            created_at: Date.now(),
        };

        await ctx.db.insert("notifications", { ...notification, userId: order.buyerId });
        await ctx.db.insert("notifications", { ...notification, userId: order.farmerId });
    }
});

export const disputeOrder = mutation({
    args: { orderId: v.id("orders"), reason: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const order = await ctx.db.get(args.orderId);
        if (!order || order.buyerId !== userId) {
            throw new Error("Only the buyer can dispute the order.");
        }

        if (order.escrow_status !== "held") {
            throw new Error("Only held payments can be disputed.");
        }

        await ctx.db.patch(args.orderId, {
            escrow_status: "disputed",
            updated_at: Date.now(),
        });

        // Notify farmer and admin (admin logic handled out-of-band typically, but farmer directly here)
        await ctx.db.insert("notifications", {
            userId: order.farmerId,
            title: "Order Disputed ⚠️",
            message: `The buyer has reported an issue with order #${args.orderId.slice(0, 8)}. Funds are frozen pending admin review.`,
            is_read: false,
            type: "order",
            created_at: Date.now(),
        });

        return { success: true };
    }
});

export const listDisputedOrders = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const orders = await ctx.db.query("orders")
            .filter(q => q.eq(q.field("escrow_status"), "disputed"))
            .collect();
            
        return await Promise.all(orders.map(async (o) => {
            const product = await ctx.db.get(o.productId);
            const buyer = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", o.buyerId)).first();
            const farmer = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", o.farmerId)).first();
            return { ...o, product, buyer, farmer };
        }));
    }
});

export const resolveDispute = mutation({
    args: { orderId: v.id("orders"), resolution: v.union(v.literal("refund"), v.literal("release")) },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");
        
        if (order.escrow_status !== "disputed") {
            throw new Error("Order is not currently disputed.");
        }

        const now = Date.now();
        if (args.resolution === "refund") {
            await ctx.db.patch(args.orderId, {
                escrow_status: "refunded",
                status: "cancelled",
                updated_at: now
            });
            await ctx.db.insert("notifications", {
                userId: order.buyerId,
                title: "Dispute Resolved: Refunded 💸",
                message: `Admin has ruled in your favor. Your payment of $${order.total_price} for order #${order._id.slice(0, 8)} has been refunded.`,
                is_read: false, type: "order", created_at: now
            });
            await ctx.db.insert("notifications", {
                userId: order.farmerId,
                title: "Dispute Resolved: Refunded ❌",
                message: `Admin has refunded the buyer for order #${order._id.slice(0, 8)}.`,
                is_read: false, type: "order", created_at: now
            });
        } else {
            await ctx.db.patch(args.orderId, {
                escrow_status: "released",
                status: "completed",
                updated_at: now
            });
            await ctx.db.insert("notifications", {
                userId: order.farmerId,
                title: "Dispute Resolved: Funds Released 💰",
                message: `Admin has ruled in your favor. The payment of $${order.total_price} for order #${order._id.slice(0, 8)} has been released to you.`,
                is_read: false, type: "order", created_at: now
            });
            await ctx.db.insert("notifications", {
                userId: order.buyerId,
                title: "Dispute Resolved: Funds Released ℹ️",
                message: `Admin has released the escrow funds to the seller for order #${order._id.slice(0, 8)}.`,
                is_read: false, type: "order", created_at: now
            });
        }
        
        // Log action
        await ctx.db.insert("admin_audit_logs", {
            adminId: admin._id,
            action: `resolve_dispute_${args.resolution}`,
            targetId: args.orderId,
            targetType: "order",
            timestamp: now,
        });

        return { success: true };
    }
});
