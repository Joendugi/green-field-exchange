import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ensureAdmin } from "./helpers";

// Global Audit Logger
// Internal helper for logging within mutations
async function logAdminAction(ctx: any, adminId: string, action: string, targetId?: string, targetType: string = "system", details?: string) {
    await ctx.db.insert("admin_audit_logs", {
        adminId,
        action,
        targetId,
        targetType,
        details,
        timestamp: Date.now(),
    });
}

// Public mutation for logging from Actions
export const createAuditLog = mutation({
    args: {
        adminId: v.string(),
        action: v.string(),
        targetId: v.optional(v.string()),
        targetType: v.string(),
        details: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // In a real app, we might want to restrict who can call this, 
        // but since actions call it internally, we allow "system" or valid admin IDs.
        await ctx.db.insert("admin_audit_logs", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const users = await ctx.db.query("users").collect(); // optimization: use count() if available or specialized index
        const products = await ctx.db.query("products").collect();
        const orders = await ctx.db.query("orders").collect();

        const revenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);

        return {
            users: users.length,
            products: products.length,
            orders: orders.length,
            revenue,
        };
    },
});

export const listUsers = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const users = await ctx.db.query("profiles").collect();

        // Enrich with roles and email (from users table if needed, likely split)
        // For now returning profiles.
        const enriched = await Promise.all(users.map(async (p) => {
            const roles = await ctx.db
                .query("user_roles")
                .withIndex("by_userId", (q) => q.eq("userId", p.userId))
                .collect();
            const authUser = await ctx.db.get(p.userId);
            return {
                ...p,
                email: authUser?.email,
                user_roles: roles
            };
        }));

        return enriched;
    },
});

export const banUser = mutation({
    args: { userId: v.id("users"), ban: v.boolean(), reason: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        // Update profile
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        if (profile) {
            await ctx.db.patch(profile._id, {
                is_banned: args.ban,
                ban_reason: args.reason,
                verified: args.ban ? false : profile.verified,
            });

            await logAdminAction(
                ctx,
                admin._id,
                args.ban ? "ban_user" : "unban_user",
                args.userId,
                "user",
                `Reason: ${args.reason || "No reason provided"}`
            );
        }
    }
});

export const updateRole = mutation({
    args: { userId: v.id("users"), role: v.string() },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        // Security: Validate role against whitelist
        const VALID_ROLES = ["user", "farmer", "buyer", "admin"];
        if (!VALID_ROLES.includes(args.role)) {
            throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
        }

        // Security: Prevent self-escalation or self-demotion
        if (args.userId === admin._id) {
            throw new Error("Cannot modify your own role. Another admin must change your role.");
        }

        const existingRole = await ctx.db
            .query("user_roles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        if (existingRole) {
            await ctx.db.patch(existingRole._id, { role: args.role });
        } else {
            await ctx.db.insert("user_roles", {
                userId: args.userId,
                role: args.role,
                created_at: Date.now(),
                granted_by: admin._id
            });
        }

        await logAdminAction(ctx, admin._id, "update_role", args.userId, "user", `New role: ${args.role}`);
    }
});

export const listVerificationRequests = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const requests = await ctx.db
            .query("verification_requests")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const enriched = await Promise.all(requests.map(async (r) => {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", r.userId))
                .unique();
            return { ...r, profiles: profile };
        }));

        return enriched;
    }
});

export const handleVerification = mutation({
    args: { requestId: v.id("verification_requests"), approve: v.boolean(), notes: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const req = await ctx.db.get(args.requestId);
        if (!req) throw new Error("Request not found");

        await ctx.db.patch(args.requestId, {
            status: args.approve ? "approved" : "rejected",
            admin_notes: args.notes,
            updated_at: Date.now()
        });

        if (args.approve) {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", req.userId))
                .unique();
            if (profile) {
                await ctx.db.patch(profile._id, { verified: true });
            }
        }

        await logAdminAction(
            ctx,
            admin._id,
            args.approve ? "approve_verification" : "reject_verification",
            args.requestId,
            "verification",
            args.notes
        );
    }
});

export const listPosts = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        // Return all posts, including hidden
        return await ctx.db.query("posts").order("desc").collect();
    }
});

export const listProducts = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        // Return all products
        return await ctx.db.query("products").order("desc").collect();
    }
});

export const broadcastNotification = mutation({
    args: { title: v.string(), message: v.string() },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        // Input validation
        if (args.title.length < 3 || args.title.length > 200) {
            throw new Error("Title must be between 3 and 200 characters");
        }

        if (args.message.length < 10 || args.message.length > 1000) {
            throw new Error("Message must be between 10 and 1000 characters");
        }

        const users = await ctx.db.query("users").collect();

        // Security: Limit broadcast size to prevent abuse
        if (users.length > 100000) {
            throw new Error("Too many users. Please use batch notification system.");
        }

        // Performance: Use parallel inserts instead of sequential loop
        const notifications = users.map(user => ({
            userId: user._id,
            title: args.title,
            message: args.message,
            is_read: false,
            created_at: Date.now(),
            type: "announcement"
        }));

        // Insert in parallel (much faster than sequential)
        await Promise.all(
            notifications.map(notification =>
                ctx.db.insert("notifications", notification)
            )
        );

        await logAdminAction(ctx, admin._id, "broadcast_notification", undefined, "announcement", args.title);
    }
});

export const listAuditLogs = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const logs = await ctx.db.query("admin_audit_logs").order("desc").take(50);

        return await Promise.all(logs.map(async (log) => {
            let adminName = "System";

            if (log.adminId !== "system") {
                const admin = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", log.adminId as any))
                    .unique();
                adminName = admin?.full_name || "Unknown Admin";
            }

            return {
                ...log,
                adminName
            };
        }));
    }
});
