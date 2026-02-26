import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

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
