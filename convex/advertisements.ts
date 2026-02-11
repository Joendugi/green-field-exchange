import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAdvertisements = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let adsQuery = ctx.db.query("advertisements");
    
    if (args.status) {
      adsQuery = adsQuery.withIndex("by_status", (q) => q.eq("status", args.status));
    }
    
    const ads = await adsQuery.take(args.limit || 20);
    
    // Filter by date (active ads)
    const now = Date.now();
    const activeAds = ads.filter(ad => 
      ad.start_date <= now && (!ad.end_date || ad.end_date >= now)
    );
    
    return activeAds;
  },
});

export const createAdvertisement = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    image_url: v.optional(v.string()),
    target_url: v.string(),
    start_date: v.number(),
    end_date: v.optional(v.number()),
    budget: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user has admin role
    const adminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!adminRole) {
      throw new Error("Not authorized");
    }
    
    const now = Date.now();
    const adId = await ctx.db.insert("advertisements", {
      ...args,
      status: "active",
      created_by: user._id,
      created_at: now,
      updated_at: now,
    });
    
    return adId;
  },
});

export const updateAdvertisement = mutation({
  args: {
    adId: v.id("advertisements"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    image_url: v.optional(v.string()),
    target_url: v.optional(v.string()),
    status: v.optional(v.string()),
    start_date: v.optional(v.number()),
    end_date: v.optional(v.number()),
    budget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user has admin role
    const adminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!adminRole) {
      throw new Error("Not authorized");
    }
    
    const ad = await ctx.db.get(args.adId);
    if (!ad) {
      throw new Error("Advertisement not found");
    }
    
    const updateData: any = { updated_at: Date.now() };
    
    // Only update provided fields
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.image_url !== undefined) updateData.image_url = args.image_url;
    if (args.target_url !== undefined) updateData.target_url = args.target_url;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.start_date !== undefined) updateData.start_date = args.start_date;
    if (args.end_date !== undefined) updateData.end_date = args.end_date;
    if (args.budget !== undefined) updateData.budget = args.budget;
    
    await ctx.db.patch(args.adId, updateData);
    
    return args.adId;
  },
});

export const deleteAdvertisement = mutation({
  args: { adId: v.id("advertisements") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user has admin role
    const adminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!adminRole) {
      throw new Error("Not authorized");
    }
    
    await ctx.db.delete(args.adId);
    
    return args.adId;
  },
});
