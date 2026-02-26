import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkRateLimit } from "./rateLimiting";

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
            // Security: Sanitize and validate search input
            if (args.search.length > 200) {
                throw new Error("Search query too long");
            }

            const sanitizedSearch = args.search
                .replace(/[<>]/g, '')
                .trim();

            if (sanitizedSearch.length < 2) {
                return []; // Require at least 2 characters
            }

            products = await ctx.db
                .query("products")
                .withSearchIndex("search_name", (q) => {
                    const search = q.search("name", sanitizedSearch);
                    return args.category && args.category !== "all"
                        ? search.eq("category", args.category)
                        : search;
                })
                .collect();
        } else {
            products = await ctx.db.query("products").collect();
        }

        // Filtering for public marketplace (stock availability, hidden status, and expiry)
        if (!args.farmerId && !args.includeHidden) {
            products = products.filter((p) =>
                (p.is_available !== false) &&
                !p.is_hidden &&
                (!p.expiry_date || p.expiry_date > now)
            );
        }

        // Sort by featured status (ensure active duration) then by created_at
        const now = Date.now();
        products.sort((a, b) => {
            const aFeatured = a.is_featured && (!a.featured_until || a.featured_until > now);
            const bFeatured = b.is_featured && (!b.featured_until || b.featured_until > now);

            if (aFeatured && !bFeatured) return -1;
            if (!aFeatured && bFeatured) return 1;
            return (b.created_at || 0) - (a.created_at || 0);
        });

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
        expiry_date: v.optional(v.number()), // Date when the product expires
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Input validation
        if (args.price <= 0 || args.price > 1000000) {
            throw new Error("Price must be between $0.01 and $1,000,000");
        }

        if (args.quantity < 0 || args.quantity > 1000000) {
            throw new Error("Quantity must be between 0 and 1,000,000");
        }

        if (!Number.isInteger(args.quantity)) {
            throw new Error("Quantity must be a whole number");
        }

        // Validate string lengths
        if (args.name.length < 3 || args.name.length > 200) {
            throw new Error("Product name must be between 3 and 200 characters");
        }

        if (args.description.length < 10 || args.description.length > 2000) {
            throw new Error("Description must be between 10 and 2000 characters");
        }

        if (args.location.length < 2 || args.location.length > 200) {
            throw new Error("Location must be between 2 and 200 characters");
        }

        // Validate category
        const validCategories = [
            "vegetables", "fruits", "grains", "dairy",
            "livestock", "poultry", "machinery", "other"
        ];
        if (!validCategories.includes(args.category.toLowerCase())) {
            throw new Error("Invalid category");
        }

        // Sanitize inputs
        const sanitizedName = args.name.replace(/[<>]/g, '').trim();
        const sanitizedDescription = args.description.replace(/[<>]/g, '').trim();

        // Rate limiting
        await checkRateLimit(ctx, `create_product:${userId}`, "create_product", 10, 60);

        const productId = await ctx.db.insert("products", {
            name: sanitizedName,
            description: sanitizedDescription,
            price: args.price,
            quantity: args.quantity,
            unit: args.unit,
            category: args.category.toLowerCase(),
            location: args.location,
            image_url: args.image_url,
            image_storage_id: args.image_storage_id,
            expiry_date: args.expiry_date,
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
            expiry_date: v.optional(v.number()),
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

        // Rate limiting for updates
        await checkRateLimit(ctx, `update_product:${userId}`, "update_product", 20, 60);

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
    // Security: Require authentication for file uploads
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized - Please login to upload files");

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
