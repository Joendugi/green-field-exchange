import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordLoginAttempt = mutation({
  args: {
    email: v.string(),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("login_attempts", {
      email: args.email,
      ip_address: args.ip_address,
      user_agent: args.user_agent,
      success: args.success,
      created_at: now,
    });
    
    return true;
  },
});

export const getRecentLoginAttempts = query({
  args: {
    email: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("login_attempts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(args.limit || 10);
    
    return attempts;
  },
});
