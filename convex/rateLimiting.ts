import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Check rate limit for password reset requests
export const checkPasswordResetLimit = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const rateLimitKey = `password_reset:${args.email}`;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Check recent password reset requests
    const recentRequests = await ctx.db
      .query("admin_audit_logs")
      .withIndex("by_timestamp", (q) => 
        q.and(
          q.eq("targetType", "email"),
          q.eq("action", "send_password_reset_email"),
          q.gte("timestamp", oneHourAgo)
        )
      )
      .collect();

    // Allow maximum 3 requests per hour
    if (recentRequests.length >= 3) {
      throw new Error("Too many password reset requests. Please try again later.");
    }

    // Log this rate limit check
    await ctx.db.insert("rate_limit_tracking", {
      key: rateLimitKey,
      action: "password_reset_check",
      timestamp: Date.now(),
    });

    return { 
      canProceed: true,
      message: "Rate limit check passed"
    };
  },
});

// Check rate limit for general actions
export const checkGeneralRateLimit = mutation({
  args: {
    key: v.string(),
    action: v.string(),
    maxRequests: v.optional(v.number()),
    timeWindow: v.optional(v.number()), // in minutes
  },
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || 60; // Default 60 minutes
    const maxRequests = args.maxRequests || 10; // Default 10 requests
    const timeWindowMs = timeWindow * 60 * 1000;
    const timeAgo = Date.now() - timeWindowMs;
    
    // Check recent requests
    const recentRequests = await ctx.db
      .query("rate_limit_tracking")
      .withIndex("by_key_action", (q) => 
        q.and(
          q.eq("key", args.key),
          q.eq("action", args.action),
          q.gte("timestamp", timeAgo)
        )
      )
      .collect();

    // Allow maximum requests per time window
    if (recentRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindow} minutes.`);
    }

    // Log this rate limit check
    await ctx.db.insert("rate_limit_tracking", {
      key: args.key,
      action: args.action,
      timestamp: Date.now(),
    });

    return { 
      canProceed: true,
      message: "Rate limit check passed",
      remainingRequests: maxRequests - recentRequests.length
    };
  },
});

// Clean up old rate limit entries
export const cleanupRateLimits = mutation({
  args: {},
  handler: async (ctx) => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Delete old rate limit entries
    const oldEntries = await ctx.db
      .query("rate_limit_tracking")
      .filter((q) => q.lt("timestamp", oneWeekAgo))
      .collect();

    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
    }

    return { 
      deleted: oldEntries.length,
      message: "Cleaned up old rate limit entries"
    };
  },
});
