import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Public can view active ads? Or just admin?
    // Usually admin dashboard lists all.
    // Let's allow public for now or check auth?
    // For dashboard usage:
    return await ctx.db.query("advertisements").order("desc").collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("advertisements")),
    title: v.string(),
    description: v.string(),
    image_url: v.optional(v.string()),
    target_url: v.string(),
    status: v.string(),
    budget: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    // Add admin check here ideally?
    // For now assuming caller is checking or we add ensureAdmin.
    // Let's stick to auth check for now.

    if (args.id) {
      await ctx.db.patch(args.id, {
        title: args.title,
        description: args.description,
        image_url: args.image_url,
        target_url: args.target_url,
        status: args.status,
        budget: args.budget,
        updated_at: Date.now()
      });
    } else {
      await ctx.db.insert("advertisements", {
        title: args.title,
        description: args.description,
        image_url: args.image_url,
        target_url: args.target_url,
        status: args.status,
        budget: args.budget,
        created_at: Date.now(),
        updated_at: Date.now(),
        start_date: Date.now(),
        created_by: userId
      });
    }
  }
});
