import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const logSearch = mutation({
    args: {
        query: v.string(),
        category: v.optional(v.string()),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        await ctx.db.insert("search_logs", {
            query: args.query,
            category: args.category,
            location: args.location,
            userId: userId ?? undefined,
            timestamp: Date.now(),
        });
    },
});

export const getFarmerAnalytics = query({
    args: { farmerId: v.id("users") },
    handler: async (ctx, args) => {
        // 1. Revenue Analytics
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
            .collect();

        const completedOrders = orders.filter(o => o.status === "completed" || o.escrow_status === "released");
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
        const totalOrders = orders.length;

        // 2. Product Performance
        const productStats: Record<string, { revenue: number, count: number, name: string }> = {};
        for (const order of completedOrders) {
            if (!productStats[order.productId]) {
                const product = await ctx.db.get(order.productId);
                productStats[order.productId] = { revenue: 0, count: 0, name: product?.name || "Deleted Product" };
            }
            productStats[order.productId].revenue += order.total_price;
            productStats[order.productId].count += 1;
        }

        // 3. Demand Heatmap (Top categories/locations searched in the last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentSearches = await ctx.db
            .query("search_logs")
            .withIndex("by_timestamp", (q) => q.gt("timestamp", thirtyDaysAgo))
            .collect();

        const categoryDemand: Record<string, number> = {};
        const locationDemand: Record<string, number> = {};

        recentSearches.forEach(log => {
            if (log.category && log.category !== "all") {
                categoryDemand[log.category] = (categoryDemand[log.category] || 0) + 1;
            }
            if (log.location) {
                const loc = log.location.toLowerCase().trim();
                locationDemand[loc] = (locationDemand[loc] || 0) + 1;
            }
        });

        return {
            totalRevenue,
            totalOrders,
            productPerformance: Object.values(productStats).sort((a, b) => b.revenue - a.revenue),
            marketTrends: {
                categories: Object.entries(categoryDemand).sort((a, b) => b[1] - a[1]).slice(0, 5),
                locations: Object.entries(locationDemand).sort((a, b) => b[1] - a[1]).slice(0, 5)
            }
        };
    },
});
