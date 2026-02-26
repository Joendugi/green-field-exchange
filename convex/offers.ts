import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const createOffer = mutation({
    args: {
        productId: v.id("products"),
        quantity: v.number(),
        amount_per_unit: v.number(),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        if (product.farmerId === userId) {
            throw new Error("You cannot negotiate with yourself!");
        }

        // Insert the offer
        const offerId = await ctx.db.insert("offers", {
            productId: args.productId,
            buyerId: userId,
            farmerId: product.farmerId,
            quantity: args.quantity,
            amount_per_unit: args.amount_per_unit,
            status: "pending",
            last_offered_by: userId,
            message: args.message,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        // Notify the farmer
        await ctx.db.insert("notifications", {
            userId: product.farmerId,
            title: "New Price Offer Received 🤝",
            message: `A buyer offered ${product.currency || "$"}${args.amount_per_unit} per unit for ${product.name}. Check your offers to respond.`,
            is_read: false,
            type: "order",
            link: "/dashboard?tab=offers",
            created_at: Date.now(),
        });

        return offerId;
    },
});

export const listByRole = query({
    args: { role: v.string() }, // "buyer" or "farmer"
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        let offers;
        if (args.role === "farmer") {
            offers = await ctx.db
                .query("offers")
                .withIndex("by_farmerId", (q) => q.eq("farmerId", userId))
                .collect();
        } else {
            offers = await ctx.db
                .query("offers")
                .withIndex("by_buyerId", (q) => q.eq("buyerId", userId))
                .collect();
        }

        // Enhance with details
        return await Promise.all(
            offers.map(async (offer) => {
                const product = await ctx.db.get(offer.productId);
                const buyer = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", offer.buyerId))
                    .unique();
                const farmer = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", offer.farmerId))
                    .unique();

                return {
                    ...offer,
                    product,
                    buyerName: buyer?.full_name || "Unknown Buyer",
                    farmerName: farmer?.full_name || "Unknown Farmer",
                };
            })
        );
    },
});

export const respond = mutation({
    args: {
        offerId: v.id("offers"),
        status: v.string(), // "accepted", "rejected", "countered"
        amount_per_unit: v.optional(v.number()),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const offer = await ctx.db.get(args.offerId);
        if (!offer) throw new Error("Offer not found");

        const isFarmer = offer.farmerId === userId;
        const isBuyer = offer.buyerId === userId;

        if (!isFarmer && !isBuyer) throw new Error("Forbidden");

        if (args.status === "accepted") {
            // 1. Mark offer as accepted
            await ctx.db.patch(args.offerId, {
                status: "accepted",
                updated_at: Date.now(),
            });

            // 2. We can automatically create an order here, or let the buyer "Checkout"
            // For simplicity, let's notify the other party to complete the transaction.
            const recipientId = isFarmer ? offer.buyerId : offer.farmerId;
            await ctx.db.insert("notifications", {
                userId: recipientId,
                title: "Offer Accepted! ✅",
                message: `Your negotiation for ${offer.quantity} units has been accepted. You can now finalize the order.`,
                is_read: false,
                type: "order",
                link: "/dashboard?tab=offers",
                created_at: Date.now(),
            });
        } else if (args.status === "countered") {
            if (!args.amount_per_unit) throw new Error("Counter amount required");

            const product = await ctx.db.get(offer.productId);

            await ctx.db.patch(args.offerId, {
                amount_per_unit: args.amount_per_unit,
                last_offered_by: userId,
                message: args.message,
                status: "pending",
                updated_at: Date.now(),
            });

            const recipientId = isFarmer ? offer.buyerId : offer.farmerId;
            await ctx.db.insert("notifications", {
                userId: recipientId,
                title: "Counter-Offer Received 🔄",
                message: `${isFarmer ? "Farmer" : "Buyer"} countered with ${product?.currency || "$"}${args.amount_per_unit} per unit.`,
                is_read: false,
                type: "order",
                link: "/dashboard?tab=offers",
                created_at: Date.now(),
            });
        }
    },
});

export const finalizeCheckout = mutation({
    args: { offerId: v.id("offers"), delivery_address: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const offer = await ctx.db.get(args.offerId);
        if (!offer || offer.buyerId !== userId) throw new Error("Not your offer");
        if (offer.status !== "accepted") throw new Error("Offer not accepted yet");

        const product = await ctx.db.get(offer.productId);
        if (!product) throw new Error("Product no longer exists");
        if (product.quantity < offer.quantity) throw new Error("Insufficient stock to finalize");

        // 1. Mark product quantity (lock it)
        await ctx.db.patch(offer.productId, {
            quantity: product.quantity - offer.quantity,
            updated_at: Date.now(),
        });

        // 2. Create the order with negotiated price
        await ctx.db.insert("orders", {
            buyerId: offer.buyerId,
            farmerId: offer.farmerId,
            productId: offer.productId,
            quantity: offer.quantity,
            total_price: offer.quantity * offer.amount_per_unit,
            currency: product.currency || "$",
            status: "pending",
            escrow_status: "held",
            payment_type: "negotiated_agreement",
            delivery_address: args.delivery_address,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        // 3. Mark offer as closed (delete or update status)
        await ctx.db.delete(args.offerId);

        // 4. Notify farmer
        await ctx.db.insert("notifications", {
            userId: offer.farmerId,
            title: "Negotiation Finalized! 📦",
            message: `A buyer has checked out your agreed offer for ${product.name}.`,
            is_read: false,
            type: "order",
            link: "/dashboard?tab=orders",
            created_at: Date.now(),
        });
    },
});
