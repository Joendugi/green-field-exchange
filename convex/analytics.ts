import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

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

        // 4. Regional Price Benchmarks
        const farmerProducts = await ctx.db
            .query("products")
            .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
            .collect();

        const benchmarks: Array<{
            productId: string,
            productName: string,
            category: string,
            location: string,
            yourPrice: number,
            marketAverage: number,
            diffPercentage: number
        }> = [];

        for (const product of farmerProducts) {
            const loc = product.location.toLowerCase().trim();
            const similarProducts = await ctx.db
                .query("products")
                .filter((q) => q.and(
                    q.eq(q.field("category"), product.category),
                    q.eq(q.field("location"), product.location)
                ))
                .collect();

            if (similarProducts.length > 0) {
                const avg = similarProducts.reduce((sum, p) => sum + p.price, 0) / similarProducts.length;
                benchmarks.push({
                    productId: product._id,
                    productName: product.name,
                    category: product.category,
                    location: product.location,
                    yourPrice: product.price,
                    marketAverage: avg,
                    diffPercentage: ((product.price - avg) / (avg || 1)) * 100
                });
            }
        }

        const productPerformance = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

        return {
            totalRevenue,
            totalOrders,
            productPerformance,
            marketTrends: {
                categories: Object.entries(categoryDemand).sort((a, b) => b[1] - a[1]).slice(0, 5),
                locations: Object.entries(locationDemand).sort((a, b) => b[1] - a[1]).slice(0, 5)
            },
            priceBenchmarks: benchmarks.sort((a, b) => Math.abs(b.diffPercentage) - Math.abs(a.diffPercentage)).slice(0, 4),
            lowStockAlerts: farmerProducts
                .filter(p => p.quantity < 10 && p.is_available)
                .map(p => ({
                    id: p._id,
                    name: p.name,
                    quantity: p.quantity,
                    unit: p.unit,
                    isBestSeller: productPerformance.some(perf => perf.name === p.name && perf.count > 5)
                }))
                .sort((a, b) => a.quantity - b.quantity),
            customerLoyalty: await (async () => {
                const buyerStats: Record<string, { count: number, spent: number, lastOrder: number }> = {};
                for (const order of completedOrders) {
                    if (!buyerStats[order.buyerId]) {
                        buyerStats[order.buyerId] = { count: 0, spent: 0, lastOrder: 0 };
                    }
                    buyerStats[order.buyerId].count += 1;
                    buyerStats[order.buyerId].spent += order.total_price;
                    buyerStats[order.buyerId].lastOrder = Math.max(buyerStats[order.buyerId].lastOrder, order.created_at);
                }

                const topBuyers = await Promise.all(
                    Object.entries(buyerStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .slice(0, 5)
                        .map(async ([buyerId, stats]) => {
                            const profile = await ctx.db
                                .query("profiles")
                                .withIndex("by_userId", (q) => q.eq("userId", buyerId as any))
                                .first();
                            
                            const reward = await ctx.db
                                .query("loyalty_discounts")
                                .withIndex("by_farmer_buyer", (q) => q.eq("farmerId", args.farmerId).eq("buyerId", buyerId as any))
                                .filter((q) => q.eq(q.field("isActive"), true))
                                .first();

                            return {
                                buyerId,
                                name: profile?.full_name || profile?.username || "Valued Buyer",
                                avatar: profile?.avatar_url,
                                isRewarded: !!reward,
                                ...stats
                            };
                        })
                );
                return topBuyers;
            })(),
            seasonalForecast: await (async () => {
                const now = new Date();
                const currentMonth = now.getMonth();
                const nextMonths = [(currentMonth + 1) % 12, (currentMonth + 2) % 12];
                
                // Group all historical orders by month and category
                const allOrders = await ctx.db.query("orders").collect();
                const seasonalDemand: Record<number, Record<string, number>> = {};
                
                for (const order of allOrders) {
                    const month = new Date(order.created_at).getMonth();
                    if (!seasonalDemand[month]) seasonalDemand[month] = {};
                    
                    const product = await ctx.db.get(order.productId);
                    if (product) {
                        const cat = product.category;
                        seasonalDemand[month][cat] = (seasonalDemand[month][cat] || 0) + 1;
                    }
                }

                // Predict for upcoming months
                return nextMonths.map(month => {
                    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, month, 1));
                    const demands = seasonalDemand[month] || {};
                    const topCategories = Object.entries(demands)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([cat]) => cat);
                    
                    return {
                        month: monthName,
                        topDemand: topCategories,
                        opportunityScore: topCategories.length > 0 ? 70 + Math.random() * 25 : 50 // Simplified score
                    };
                });
            })()
        };
    },
});

export const toggleLoyaltyReward = mutation({
    args: {
        farmerId: v.id("users"),
        buyerId: v.id("users"),
        active: v.boolean(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId || userId !== args.farmerId) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("loyalty_discounts")
            .withIndex("by_farmer_buyer", (q) => q.eq("farmerId", args.farmerId).eq("buyerId", args.buyerId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { isActive: args.active });
        } else if (args.active) {
            await ctx.db.insert("loyalty_discounts", {
                farmerId: args.farmerId,
                buyerId: args.buyerId,
                discountPercentage: 10, // Standard 10% loyalty reward
                orderCountThreshold: 3,
                isActive: true,
                created_at: Date.now(),
            });
        }

        if (args.active) {
            // Send notification email to the buyer
            const [buyer, farmer, buyerProfile, farmerProfile] = await Promise.all([
                ctx.db.get(args.buyerId),
                ctx.db.get(args.farmerId),
                ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.buyerId as any)).first(),
                ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.farmerId as any)).first(),
            ]);

            if (buyer?.email) {
                await ctx.scheduler.runAfter(0, api.emailService.sendLoyaltyRewardEmail, {
                    email: buyer.email,
                    userName: buyerProfile?.full_name || (buyer as any).name || "Valued Buyer",
                    farmerName: farmerProfile?.full_name || (farmer as any)?.name || "A Local Farmer"
                });
            }
        }
    },
});

export const getGlobalHeatmap = query({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db.query("products").collect();
        const orders = await ctx.db.query("orders").collect();

        const heatmap: Record<string, { products: number, orders: number, revenue: number }> = {};

        // Aggregate products
        products.forEach(p => {
            const loc = p.location.toLowerCase().trim();
            if (!heatmap[loc]) heatmap[loc] = { products: 0, orders: 0, revenue: 0 };
            heatmap[loc].products += 1;
        });

        // Aggregate orders
        for (const o of orders) {
            // We need the location of the product for that order
            const product = await ctx.db.get(o.productId);
            if (product) {
                const loc = product.location.toLowerCase().trim();
                if (!heatmap[loc]) heatmap[loc] = { products: 0, orders: 0, revenue: 0 };
                heatmap[loc].orders += 1;
                heatmap[loc].revenue += o.total_price;
            }
        }

        return Object.entries(heatmap)
            .map(([location, stats]) => ({ location, ...stats }))
            .sort((a, b) => b.revenue - a.revenue);
    }
});
