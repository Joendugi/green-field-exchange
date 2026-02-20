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
        q.gte("timestamp", oneHourAgo)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("targetType"), "email"),
          q.eq(q.field("action"), "send_password_reset_email")
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

// Internal helper for rate limiting within mutations
export async function checkRateLimit(
  ctx: any,
  key: string,
  action: string,
  maxRequests: number = 10,
  timeWindow: number = 60 // minutes
) {
  const timeWindowMs = timeWindow * 60 * 1000;
  const timeAgo = Date.now() - timeWindowMs;

  // Check recent requests
  const recentRequests = await ctx.db
    .query("rate_limit_tracking")
    .withIndex("by_key_action", (q: any) =>
      q.eq("key", key).eq("action", action)
    )
    .filter((q) => q.gte(q.field("timestamp"), timeAgo))
    .collect();

  // Allow maximum requests per time window
  if (recentRequests.length >= maxRequests) {
    throw new Error(`Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindow} minutes.`);
  }

  // Log this rate limit check
  await ctx.db.insert("rate_limit_tracking", {
    key: key,
    action: action,
    timestamp: Date.now(),
  });

  return {
    canProceed: true,
    remainingRequests: maxRequests - recentRequests.length
  };
}

// Check rate limit for general actions (Exposed Mutation)
export const checkGeneralRateLimit = mutation({
  args: {
    key: v.string(),
    action: v.string(),
    maxRequests: v.optional(v.number()),
    timeWindow: v.optional(v.number()), // in minutes
  },
  handler: async (ctx, args) => {
    return await checkRateLimit(
      ctx,
      args.key,
      args.action,
      args.maxRequests,
      args.timeWindow
    );
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
      .filter((q) => q.lt(q.field("timestamp"), oneWeekAgo))
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
