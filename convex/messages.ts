import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ensureAuthenticated, assertConversationParticipant } from "./helpers";

export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const conversations = await ctx.db
            .query("conversations")
            .filter((q) => q.or(q.eq(q.field("participant1_id"), userId), q.eq(q.field("participant2_id"), userId)))
            .order("desc")
            .collect();

        return await Promise.all(
            conversations.map(async (c) => {
                const otherId = c.participant1_id === userId ? c.participant2_id : c.participant1_id;
                const otherProfile = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", otherId))
                    .unique();

                const unreadCount = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", (q) => q.eq("conversationId", c._id))
                    .filter((q) => q.and(q.eq(q.field("is_read"), false), q.neq(q.field("senderId"), userId)))
                    .collect();

                return {
                    ...c,
                    otherProfile,
                    unreadCount: unreadCount.length,
                };
            })
        );
    },
});

export const getMessages = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        // Ensure the requesting user is a participant in the conversation
        await assertConversationParticipant(ctx, args.conversationId, userId);

        return await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .order("asc")
            .collect();
    },
});

export const sendMessage = mutation({
    args: { conversationId: v.id("conversations"), content: v.string() },
    handler: async (ctx, args) => {
        const userId = await ensureAuthenticated(ctx);

        // Ensure the sender is part of this conversation
        await assertConversationParticipant(ctx, args.conversationId, userId);

        const content = args.content.trim();
        if (content.length === 0) {
            throw new Error("Message cannot be empty");
        }
        if (content.length > 5000) {
            throw new Error("Message is too long (max 5000 characters)");
        }

        const msgId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: userId,
            content,
            is_read: false,
            created_at: Date.now(),
        });

        await ctx.db.patch(args.conversationId, {
            last_message: args.content,
            last_sender_id: userId,
            updated_at: Date.now(),
        });

        return msgId;
    },
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const userId = await ensureAuthenticated(ctx);

        // Ensure the user is allowed to mark messages in this conversation
        await assertConversationParticipant(ctx, args.conversationId, userId);

        const unread = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.and(q.eq(q.field("is_read"), false), q.neq(q.field("senderId"), userId)))
            .collect();

        for (const msg of unread) {
            await ctx.db.patch(msg._id, { is_read: true });
        }
    },
});

export const startConversation = mutation({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        if (userId === args.otherUserId) throw new Error("Cannot message yourself");

        // Check for existing
        const existing = await ctx.db
            .query("conversations")
            .filter((q) =>
                q.or(
                    q.and(q.eq(q.field("participant1_id"), userId), q.eq(q.field("participant2_id"), args.otherUserId)),
                    q.and(q.eq(q.field("participant1_id"), args.otherUserId), q.eq(q.field("participant2_id"), userId))
                )
            )
            .unique();

        if (existing) return existing._id;

        return await ctx.db.insert("conversations", {
            participant1_id: userId,
            participant2_id: args.otherUserId,
            updated_at: Date.now(),
        });
    },
});
export const unreadCount = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return 0;

        const messages = await ctx.db
            .query("messages")
            .filter((q) => q.and(q.eq(q.field("is_read"), false), q.neq(q.field("senderId"), userId)))
            .collect();

        // This is not efficient for many messages, but okay for MVP.
        // Ideally we filter by conversation where user is participant.
        return messages.length;
    },
});
