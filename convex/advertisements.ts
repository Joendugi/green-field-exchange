import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensureAdmin } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Public: only show active advertisements
    return await ctx.db
      .query("advertisements")
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();
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
    const admin = await ensureAdmin(ctx);

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
        created_by: admin._id
      });
    }
  }
});
