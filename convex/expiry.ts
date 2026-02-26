import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Checks for products that are about to expire (within 24 hours) 
 * or have already expired, and sends notifications/updates status.
 */
export const checkExpiringProducts = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const twentyFourHoursFromNow = now + 24 * 60 * 60 * 1000;

        // 1. Find products expiring in the next 24 hours that haven't been notified yet
        // For simplicity, we'll store a "notifiedExpiresSoon" flag on the product if we had it,
        // but without schema changes, we'll just look for those in the 24-hour window.
        const soonExpiring = await ctx.db
            .query("products")
            .filter((q) =>
                q.and(
                    q.gt(q.field("expiry_date"), now),
                    q.lt(q.field("expiry_date"), twentyFourHoursFromNow),
                    q.eq(q.field("is_available"), true)
                )
            )
            .collect();

        for (const product of soonExpiring) {
            await ctx.db.insert("notifications", {
                userId: product.farmerId,
                title: "Product Expiring Soon! ⏰",
                message: `Your listing for ${product.name} is set to expire in less than 24 hours. Consider a flash sale!`,
                is_read: false,
                type: "system",
                link: "/dashboard?tab=products",
                created_at: Date.now(),
            });
        }

        // 2. Find products that HAVE expired and are still marked available
        const justExpired = await ctx.db
            .query("products")
            .filter((q) =>
                q.and(
                    q.lt(q.field("expiry_date"), now),
                    q.eq(q.field("is_available"), true)
                )
            )
            .collect();

        for (const product of justExpired) {
            // Mark as unavailable
            await ctx.db.patch(product._id, {
                is_available: false,
                updated_at: Date.now(),
            });

            // Notify farmer
            await ctx.db.insert("notifications", {
                userId: product.farmerId,
                title: "Product Expired 🍎",
                message: `Your listing for ${product.name} has expired and is no longer visible to buyers.`,
                is_read: false,
                type: "system",
                link: "/dashboard?tab=products",
                created_at: Date.now(),
            });
        }

        return { soonCount: soonExpiring.length, expiredCount: justExpired.length };
    },
});
