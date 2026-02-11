import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to ensure admin
async function ensureAdmin(ctx: any) {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const roleData = await ctx.db
        .query("user_roles")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("role"), "admin"))
        .unique();

    if (!roleData) throw new Error("Admin privileges required");

    // Sudo Mode check (require auth within last 15 mins for destructive mutations)
    // We'll update this field on every 'admin login' (which we are refactoring to a profile button)
    // For now, let's just use it as a placeholder for enhanced security.

    const user = await ctx.db.get(userId);
    return { user, roleId: roleData._id };
}

// Global Audit Logger
async function logAdminAction(ctx: any, adminId: any, action: string, targetId?: string, targetType: string = "system", details?: string) {
    await ctx.db.insert("admin_audit_logs", {
        adminId,
        action,
        targetId,
        targetType,
        details,
        timestamp: Date.now(),
    });
}

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
        const { user: admin } = await ensureAdmin(ctx);

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
        const { user: admin } = await ensureAdmin(ctx);

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
        const { user: admin } = await ensureAdmin(ctx);

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
        const { user: admin } = await ensureAdmin(ctx);

        const users = await ctx.db.query("users").collect();

        for (const user of users) {
            await ctx.db.insert("notifications", {
                userId: user._id,
                title: args.title,
                message: args.message,
                is_read: false,
                created_at: Date.now(),
                type: "announcement"
            });
        }

        await logAdminAction(ctx, admin._id, "broadcast_notification", undefined, "announcement", args.title);
    }
});

export const listAuditLogs = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const logs = await ctx.db.query("admin_audit_logs").order("desc").take(50);

        return await Promise.all(logs.map(async (log) => {
            const admin = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", log.adminId))
                .unique();
            return {
                ...log,
                adminName: admin?.full_name || "Unknown Admin"
            };
        }));
    }
});
