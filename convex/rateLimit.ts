import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Simple rate limiting implementation for Convex
 * Tracks requests per user/IP and enforces limits
 */

// Rate limit configuration
const RATE_LIMITS = {
    // Mutations (write operations)
    createOrder: { maxRequests: 10, windowMs: 60000 }, // 10 orders per minute
    createProduct: { maxRequests: 20, windowMs: 60000 }, // 20 products per minute
    createPost: { maxRequests: 30, windowMs: 60000 }, // 30 posts per minute
    uploadFile: { maxRequests: 10, windowMs: 60000 }, // 10 uploads per minute

    // Admin operations (stricter limits)
    adminBroadcast: { maxRequests: 5, windowMs: 3600000 }, // 5 broadcasts per hour
    adminBanUser: { maxRequests: 20, windowMs: 3600000 }, // 20 bans per hour

    // Authentication
    login: { maxRequests: 5, windowMs: 300000 }, // 5 login attempts per 5 minutes
} as const;

// Store rate limit data
export const checkRateLimit = query({
    args: {
        userId: v.optional(v.id("users")),
        action: v.string(),
        identifier: v.optional(v.string()), // IP address or session ID
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const key = args.userId || args.identifier || "anonymous";

        // Get rate limit config for this action
        const config = RATE_LIMITS[args.action as keyof typeof RATE_LIMITS];
        if (!config) {
            return { allowed: true, remaining: 999 };
        }

        // Query recent requests
        const recentRequests = await ctx.db
            .query("rate_limit_tracking")
            .withIndex("by_key_action", (q) =>
                q.eq("key", key).eq("action", args.action)
            )
            .filter((q) => q.gte(q.field("timestamp"), now - config.windowMs))
            .collect();

        const requestCount = recentRequests.length;
        const allowed = requestCount < config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - requestCount);

        return {
            allowed,
            remaining,
            resetAt: recentRequests[0]?.timestamp
                ? recentRequests[0].timestamp + config.windowMs
                : now + config.windowMs,
        };
    },
});

export const recordRequest = mutation({
    args: {
        userId: v.optional(v.id("users")),
        action: v.string(),
        identifier: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const key = args.userId || args.identifier || "anonymous";

        await ctx.db.insert("rate_limit_tracking", {
            key,
            action: args.action,
            timestamp: Date.now(),
        });
    },
});

// Cleanup old rate limit records (run periodically)
export const cleanupRateLimits = mutation({
    args: {},
    handler: async (ctx) => {
        const cutoff = Date.now() - 3600000; // 1 hour ago

        const oldRecords = await ctx.db
            .query("rate_limit_tracking")
            .filter((q) => q.lt(q.field("timestamp"), cutoff))
            .collect();

        for (const record of oldRecords) {
            await ctx.db.delete(record._id);
        }

        return { deleted: oldRecords.length };
    },
});
