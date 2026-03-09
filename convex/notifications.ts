import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ensureAuthenticated, assertNotificationOwner } from "./helpers";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(50);

        return notifications.sort((a, b) => b.created_at - a.created_at);
    },
});

export const markRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
    const userId = await ensureAuthenticated(ctx);

    // Verify ownership before marking as read
    await assertNotificationOwner(ctx, args.notificationId, userId);
    await ctx.db.patch(args.notificationId, { is_read: true });
    },
});
export const markAllRead = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("is_read"), false))
            .collect();

        for (const n of unread) {
            await ctx.db.patch(n._id, { is_read: true });
        }
    },
});

// Internal: called by nightly cron — deletes READ notifications older than 30 days
export const archiveOldNotifications = internalMutation({
    args: {},
    handler: async (ctx) => {
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - THIRTY_DAYS;

        // Process up to 500 at a time so each cron run is safe
        const old = await ctx.db
            .query("notifications")
            .filter((q) => q.and(
                q.eq(q.field("is_read"), true),
                q.lt(q.field("created_at"), cutoff)
            ))
            .take(500);

        for (const n of old) {
            await ctx.db.delete(n._id);
        }
        return { archived: old.length };
    },
});
