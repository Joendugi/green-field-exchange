import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";
import { checkRateLimit } from "./rateLimiting";
import { Id, Doc } from "./_generated/dataModel";

// List products with optional filters and cursor-based pagination
export const list = query({
    args: {
        category: v.optional(v.string()),
        search: v.optional(v.string()),
        farmerId: v.optional(v.id("users")),
        includeHidden: v.optional(v.boolean()),
        limit: v.optional(v.number()),    // max items per page (default 40)
        cursor: v.optional(v.string()),   // last _id from previous page
    },
    handler: async (ctx, args) => {
        const PAGE_SIZE = Math.min(args.limit ?? 40, 100); // hard cap at 100
        const now = Date.now();
        let products;

        if (args.farmerId) {
            products = await ctx.db
                .query("products")
                .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId!))
                .order("desc")
                .take(PAGE_SIZE * 2); // take a little more to allow client-side expiry filtering
        } else if (args.search) {
            if (args.search.length > 200) throw new Error("Search query too long");
            const sanitizedSearch = args.search.replace(/[<>]/g, '').trim();
            if (sanitizedSearch.length < 2) return [];

            products = await ctx.db
                .query("products")
                .withSearchIndex("search_name", (q) => {
                    const search = q.search("name", sanitizedSearch);
                    return args.category && args.category !== "all"
                        ? search.eq("category", args.category)
                        : search;
                })
                .take(PAGE_SIZE);
        } else if (args.category && args.category !== "all") {
            products = await ctx.db
                .query("products")
                .withIndex("by_category", (q) => q.eq("category", args.category!))
                .order("desc")
                .take(PAGE_SIZE);
        } else {
            // Default: paginated, sorted by created_at desc
            let q = ctx.db.query("products").withIndex("by_created_at").order("desc");
            if (args.cursor) {
                const cursorDoc = await ctx.db.get(args.cursor as Id<"products">);
                if (cursorDoc) {
                    q = q.filter((f) => f.lt(f.field("created_at"), cursorDoc.created_at)) as any;
                }
            }
            products = await q.take(PAGE_SIZE);
        }

        // Public marketplace filters (availability, expiry, hidden)
        if (!args.farmerId && !args.includeHidden) {
            products = products.filter((p) =>
                (p.is_available !== false) &&
                p.quantity > 0 &&
                !p.is_hidden &&
                (!p.expiry_date || p.expiry_date > now)
            );
        }

        // Sort: featured first, then by created_at — only for default (non-search) views
        if (!args.search) {
            products = [...products].sort((a, b) => {
                const aFeatured = a.is_featured && (!a.featured_until || a.featured_until > now);
                const bFeatured = b.is_featured && (!b.featured_until || b.featured_until > now);
                if (aFeatured && !bFeatured) return -1;
                if (!aFeatured && bFeatured) return 1;
                return (b.created_at || 0) - (a.created_at || 0);
            });
        }

        // Slice to PAGE_SIZE after sort
        products = products.slice(0, PAGE_SIZE);

        // Enrich with farmer profile & storage URL
        return await Promise.all(products.map(async (p) => {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", p.farmerId))
                .first();
            return {
                ...p,
                image_url: p.image_storage_id
                    ? await ctx.storage.getUrl(p.image_storage_id)
                    : p.image_url,
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
            .filter((q) => q.and(
                q.eq(q.field("is_available"), true),
                q.neq(q.field("is_hidden"), true),
                q.gt(q.field("quantity"), 0)
            ))
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
        currency: v.optional(v.string()), // Optional currency symbol
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
            currency: args.currency || "$",
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


export const bulkUpdate = mutation({
    args: {
        ids: v.array(v.id("products")),
        changes: v.object({
            price: v.optional(v.number()),
            quantity: v.optional(v.number()),
            is_available: v.optional(v.boolean()),
            category: v.optional(v.string()),
            location: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        for (const id of args.ids) {
            const product = await ctx.db.get(id);
            if (!product || product.farmerId !== userId) {
                continue;
            }
            await ctx.db.patch(id, {
                ...args.changes,
                updated_at: Date.now(),
            });
        }
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

export const listAll = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        const products = await ctx.db
            .query("products")
            .filter((q) => q.eq(q.field("is_available"), true))
            .take(args.limit || 100);

        if (!userId) return products;

        // Map through products and apply loyalty discounts if available
        return await Promise.all(products.map(async (p) => {
            const discount = await ctx.db
                .query("loyalty_discounts")
                .withIndex("by_farmer_buyer", (q) => q.eq("farmerId", p.farmerId).eq("buyerId", userId as any))
                .filter((q) => q.eq(q.field("isActive"), true))
                .first();

            if (discount) {
                return {
                    ...p,
                    discountedPrice: p.price * (1 - discount.discountPercentage / 100),
                    hasLoyaltyDiscount: true,
                };
            }
            return p;
        }));
    }
});

export const getByIds = query({
    args: { ids: v.array(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        const results = [];
        for (const id of args.ids) {
            try {
                const product = await ctx.db.get(id as Id<"products">);
                if (product && "unit" in product) {
                    const p = product as Doc<"products">;
                    const profile = await ctx.db
                        .query("profiles")
                        .withIndex("by_userId", (q) => q.eq("userId", p.farmerId))
                        .first();

                    let discountedPrice = p.price;
                    let hasLoyaltyDiscount = false;

                    if (userId) {
                        const discount = await ctx.db
                            .query("loyalty_discounts")
                            .withIndex("by_farmer_buyer", (q) => q.eq("farmerId", p.farmerId).eq("buyerId", userId as any))
                            .filter((q) => q.eq(q.field("isActive"), true))
                            .first();
                        
                        if (discount) {
                            discountedPrice = p.price * (1 - discount.discountPercentage / 100);
                            hasLoyaltyDiscount = true;
                        }
                    }

                    results.push({
                        ...p,
                        image_url: p.image_storage_id ? await ctx.storage.getUrl(p.image_storage_id) : p.image_url,
                        profiles: profile,
                        discountedPrice,
                        hasLoyaltyDiscount
                    });
                }
            } catch {
                // Ignore invalid IDs
            }
        }
        return results;
    }
});
