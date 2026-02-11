import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all products with optional filters
export const list = query({
    args: {
        category: v.optional(v.string()),
        search: v.optional(v.string()),
        farmerId: v.optional(v.id("users")),
        includeHidden: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let products;

        if (args.farmerId) {
            products = await ctx.db
                .query("products")
                .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId!))
                .collect();
        } else if (args.category && args.category !== "all") {
            products = await ctx.db
                .query("products")
                .withIndex("by_category", (q) => q.eq("category", args.category!))
                .collect();
        } else if (args.search) {
            products = await ctx.db
                .query("products")
                .withSearchIndex("search_name", (q) => {
                    const search = q.search("name", args.search!);
                    return args.category && args.category !== "all"
                        ? search.eq("category", args.category)
                        : search;
                })
                .collect();
        } else {
            products = await ctx.db.query("products").collect();
        }

        // Filtering for public marketplace
        if (!args.farmerId && !args.includeHidden) {
            products = products.filter((p) => (p.is_available !== false) && !p.is_hidden);
        }

        // Generate image URLs and enhance with profile
        return await Promise.all(products.map(async (p) => {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", p.farmerId))
                .unique();

            return {
                ...p,
                image_url: p.image_storage_id ? await ctx.storage.getUrl(p.image_storage_id) : p.image_url,
                profiles: profile,
            };
        }));
    },
});

export const listRecommendations = query({
    args: {},
    handler: async (ctx) => {
        // Simple recommendation: return 4 random available products
        const products = await ctx.db
            .query("products")
            .filter((q) => q.and(q.eq(q.field("is_available"), true), q.neq(q.field("is_hidden"), true)))
            .take(4);

        return await Promise.all(products.map(async (p) => ({
            ...p,
            image_url: p.image_storage_id ? await ctx.storage.getUrl(p.image_storage_id) : p.image_url
        })));
    }
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        price: v.number(),
        quantity: v.number(),
        unit: v.string(),
        category: v.string(),
        location: v.string(),
        image_url: v.optional(v.string()),
        image_storage_id: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const productId = await ctx.db.insert("products", {
            ...args,
            farmerId: userId,
            is_available: true,
            is_hidden: false,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return productId;
    },
});

export const update = mutation({
    args: {
        id: v.id("products"),
        changes: v.object({
            name: v.optional(v.string()),
            description: v.optional(v.string()),
            price: v.optional(v.number()),
            quantity: v.optional(v.number()),
            unit: v.optional(v.string()),
            category: v.optional(v.string()),
            location: v.optional(v.string()),
            image_url: v.optional(v.string()),
            image_storage_id: v.optional(v.id("_storage")),
            is_available: v.optional(v.boolean()),
            is_hidden: v.optional(v.boolean()),
        }),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const product = await ctx.db.get(args.id);
        if (!product) throw new Error("Product not found");

        if (product.farmerId !== userId) {
            // Check if admin? For now rigid ownership check.
            throw new Error("Unauthorized to edit this product");
        }

        await ctx.db.patch(args.id, {
            ...args.changes,
            updated_at: Date.now(),
        });
    },
});


export const remove = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const product = await ctx.db.get(args.id);
        if (!product) throw new Error("Product not found");

        if (product.farmerId !== userId) {
            throw new Error("Unauthorized to delete this product");
        }

        await ctx.db.delete(args.id);
    },
});

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const predictPrice = action({
    args: { category: v.string(), location: v.string() },
    handler: async (ctx, args) => {
        const { category, location } = args;

        // Simulated AI Logic (migrated from Appwrite function)
        const basePrices: Record<string, number> = {
            vegetables: 2.0,
            fruits: 3.5,
            grains: 10.0,
            dairy: 5.0,
            livestock: 500.0,
            poultry: 4.0,
            machinery: 1200.0,
            other: 5.0
        };

        const locationMultiplier = location.toLowerCase().includes("urban") ? 1.2 : 0.9;
        // Use category or default to 'other' (5.0)
        const basePrice = basePrices[category.toLowerCase()] || 5.0;
        const suggestedPrice = basePrice * locationMultiplier;

        return {
            suggested_price: suggestedPrice,
            confidence: "High",
            reasoning: `Based on current market trends in ${location} for ${category}, prices are stable with a slight upward trend due to seasonal demand.`
        };
    }
});
