import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkRateLimit } from "./rateLimiting";

export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) return null;

        // Convert storage ID to URL if avatar_url is a storage ID
        let avatarUrl = profile.avatar_url;
        if (avatarUrl && avatarUrl.startsWith("kg")) {
            // It's a storage ID, convert to URL
            try {
                avatarUrl = (await ctx.storage.getUrl(avatarUrl as any)) ?? undefined;
            } catch (error) {
                console.error("Error getting avatar URL:", error);
                avatarUrl = undefined;
            }
        }

        return {
            ...profile,
            avatar_url: avatarUrl,
        };
    },
});

export const getUserProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) return null;

        // Convert storage ID to URL if avatar_url is a storage ID
        let avatarUrl = profile.avatar_url;
        if (avatarUrl && avatarUrl.startsWith("kg")) {
            // It's a storage ID, convert to URL
            try {
                avatarUrl = (await ctx.storage.getUrl(avatarUrl as any)) ?? undefined;
            } catch (error) {
                console.error("Error getting avatar URL:", error);
                avatarUrl = undefined;
            }
        }

        return {
            ...profile,
            avatar_url: avatarUrl,
        };
    },
});

export const getUserProfiles = query({
    args: { userIds: v.array(v.id("users")) },
    handler: async (ctx, args) => {
        const profiles = await Promise.all(
            args.userIds.map(async (userId) => {
                const profile = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", userId))
                    .first();

                if (!profile) return null;

                // Convert storage ID to URL if avatar_url is a storage ID
                let avatarUrl = profile.avatar_url;
                if (avatarUrl && avatarUrl.startsWith("kg")) {
                    try {
                        avatarUrl = (await ctx.storage.getUrl(avatarUrl as any)) ?? undefined;
                    } catch (error) {
                        console.error("Error getting avatar URL:", error);
                        avatarUrl = undefined;
                    }
                }

                return {
                    ...profile,
                    avatar_url: avatarUrl,
                };
            })
        );

        return profiles.filter((p) => p !== null);
    },
});

export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        return await ctx.db
            .query("user_settings")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
    },
});

export const updateSettings = mutation({
    args: {
        notifications_enabled: v.optional(v.boolean()),
        notifications_orders: v.optional(v.boolean()),
        notifications_social: v.optional(v.boolean()),
        notifications_system: v.optional(v.boolean()),
        ai_assistant_enabled: v.optional(v.boolean()),
        dark_mode: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("user_settings")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        const now = Date.now();
        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                updated_at: now,
            });
        } else {
            await ctx.db.insert("user_settings", {
                userId,
                notifications_enabled: args.notifications_enabled ?? true,
                notifications_orders: args.notifications_orders ?? true,
                notifications_social: args.notifications_social ?? true,
                notifications_system: args.notifications_system ?? true,
                ai_assistant_enabled: args.ai_assistant_enabled ?? true,
                dark_mode: args.dark_mode ?? false,
                created_at: now,
                updated_at: now,
            });
        }
    },
});

export const getUploadUrl = mutation(async (ctx) => {
    // Security: Require authentication for file uploads
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized - Please login to upload files");

    return await ctx.storage.generateUploadUrl();
});

export const updateProfile = mutation({
    args: {
        username: v.optional(v.string()), // Unique check needed? 
        full_name: v.optional(v.string()),
        bio: v.optional(v.string()),
        location: v.optional(v.string()),
        website: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
        role: v.optional(v.string()),
        onboarding_completed: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const { role, ...profileArgs } = args;

        // Allow initial non-privileged role assignment (e.g. buyer/farmer) but
        // prevent elevation or changes to existing roles. Admin-only paths
        // (see admin.updateRole) handle privileged role management.
        if (role) {
            const PUBLIC_ROLES = ["farmer"] as const;

            const existingRole = await ctx.db
                .query("user_roles")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .first();

            if (!existingRole) {
                const assignedRole = PUBLIC_ROLES.includes(role as any) ? role : "farmer";
                await ctx.db.insert("user_roles", {
                    userId,
                    role: assignedRole,
                    created_at: Date.now(),
                });
            }
            // If a role already exists, updates must go through admin.updateRole.
        }

        const existingProfile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (existingProfile) {
            // Rate limit profile updates
            await checkRateLimit(ctx, `update_profile:${userId}`, "update_profile", 5, 60);

            await ctx.db.patch(existingProfile._id, {
                ...profileArgs,
                updated_at: Date.now(),
            });
        } else {
            await ctx.db.insert("profiles", {
                userId: userId,
                verified: false,
                verification_requested: false,
                onboarded: true,
                created_at: Date.now(),
                updated_at: Date.now(),
                ...profileArgs,
                username: profileArgs.username || (await ctx.db.get(userId))?.email || "user",
            });
        }
    },
});




export const getRole = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        let userId = args.userId;
        if (!userId) {
            userId = (await getAuthUserId(ctx)) ?? undefined;
        }
        if (!userId) return null;

        return await ctx.db
            .query("user_roles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
    },
});

export const requestVerification = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("verification_requests")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "in_review")))
            .first();

        if (existing) throw new Error("Verification already pending");

        await ctx.db.insert("verification_requests", {
            userId,
            status: "pending",
            created_at: Date.now(),
            updated_at: Date.now(),
        });
    }
});

export const getFollowersCount = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        let userId = args.userId;
        if (!userId) {
            userId = (await getAuthUserId(ctx)) ?? undefined;
        }
        if (!userId) return 0;

        const follows = await ctx.db
            .query("follows")
            .withIndex("by_followingId", (q) => q.eq("followingId", userId!))
            .collect();
        return follows.length;
    }
});

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const searchUsers = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        // Security: Validate and sanitize search input
        if (args.query.length > 100) {
            throw new Error("Search query too long");
        }

        const searchTerm = args.query
            .replace(/[<>]/g, '')
            .toLowerCase()
            .trim();

        if (!searchTerm || searchTerm.length < 2) return [];

        const results = await ctx.db
            .query("profiles")
            .withSearchIndex("search_profiles", (q) =>
                q.search("username", searchTerm)
            )
            .take(10);

        return results.filter(p => p.userId !== userId);
    },
});
