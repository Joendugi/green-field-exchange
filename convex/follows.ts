import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";
import { ensureAuthenticated } from "./helpers";

export const follow = mutation({
    args: { followingId: v.id("users") },
    handler: async (ctx, args) => {
        const userId = await ensureAuthenticated(ctx);

        if (userId === args.followingId) throw new Error("Cannot follow yourself");

        const existing = await ctx.db
            .query("follows")
            .withIndex("by_followerId", (q) => q.eq("followerId", userId).eq("followingId", args.followingId))
            .unique();

        if (existing) return;

        await ctx.db.insert("follows", {
            followerId: userId,
            followingId: args.followingId,
            created_at: Date.now(),
        });
    },
});

export const unfollow = mutation({
    args: { followingId: v.id("users") },
    handler: async (ctx, args) => {
        const userId = await ensureAuthenticated(ctx);

        const existing = await ctx.db
            .query("follows")
            .withIndex("by_followerId", (q) => q.eq("followerId", userId).eq("followingId", args.followingId))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

export const isFollowing = query({
    args: { followerId: v.optional(v.id("users")), followingId: v.id("users") },
    handler: async (ctx, args) => {
        let followerId = args.followerId;
        if (!followerId) {
            followerId = await getAuthUserId(ctx) || undefined;
        }

        if (!followerId) return false;

        const follow = await ctx.db
            .query("follows")
            .withIndex("by_followerId", (q) => q.eq("followerId", followerId!).eq("followingId", args.followingId))
            .unique();

        return !!follow;
    },
});

export const getCounts = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const followers = await ctx.db
            .query("follows")
            .withIndex("by_followingId", (q) => q.eq("followingId", args.userId))
            .collect();

        const following = await ctx.db
            .query("follows")
            .withIndex("by_followerId", (q) => q.eq("followerId", args.userId))
            .collect();

        return {
            followers: followers.length,
            following: following.length,
        };
    },
});

export const getFollowers = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const followsDocs = await ctx.db
            .query("follows")
            .withIndex("by_followingId", (q) => q.eq("followingId", args.userId))
            .collect();

        return await Promise.all(
            followsDocs.map(async (f) => {
                const profile = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", f.followerId))
                    .unique();
                return {
                    follower_id: f.followerId,
                    profiles: profile,
                };
            })
        );
    },
});
