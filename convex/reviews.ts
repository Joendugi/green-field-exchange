import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";

export const listForProduct = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .collect();

        return await Promise.all(reviews.map(async (r) => {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", r.reviewerId))
                .unique();
            return {
                ...r,
                reviewerName: profile?.full_name || "Unknown User",
                reviewerAvatar: profile?.avatar_url,
            };
        }));
    },
});

export const submitRating = mutation({
    args: {
        orderId: v.id("orders"),
        productId: v.id("products"),
        farmerId: v.id("users"),
        rating: v.number(),
        comment: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const order = await ctx.db.get(args.orderId);
        if (!order || order.buyerId !== userId) {
            throw new Error("Invalid order");
        }

        // 1. Submit the review
        await ctx.db.insert("reviews", {
            reviewerId: userId,
            revieweeId: args.farmerId,
            productId: args.productId,
            rating: args.rating,
            comment: args.comment,
            created_at: Date.now(),
        });

        // 2. Mark order as reviewed if you add that flag later
        // For now, it's just a one-off submission.
    },
});

export const getFarmerRating = query({
    args: { farmerId: v.id("users") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_revieweeId", (q) => q.eq("revieweeId", args.farmerId))
            .collect();

        if (reviews.length === 0) return { average: 0, count: 0 };

        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        return {
            average: total / reviews.length,
            count: reviews.length,
        };
    },
});
