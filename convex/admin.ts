import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
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

export const checkAdmin = query({
    args: {},
    handler: async (ctx) => {
        try {
            return await ensureAdmin(ctx);
        } catch {
            return null;
        }
    }
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const users = await ctx.db.query("users").collect();
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
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, {
                is_banned: args.ban,
                ban_reason: args.reason,
                verified: args.ban ? false : profile.verified,
            });

            const targetUser = await ctx.db.get(args.userId);

            await logAdminAction(
                ctx,
                admin._id,
                args.ban ? "ban_user" : "unban_user",
                args.userId,
                "user",
                `Reason: ${args.reason || "No reason provided"}`
            );

            if (args.ban && targetUser?.email) {
                await ctx.scheduler.runAfter(0, api.emailService.sendBanNotification, {
                    email: targetUser.email,
                    userName: targetUser.name || "User",
                    reason: args.reason
                });
            }
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
            .first();

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

        const targetUser = await ctx.db.get(args.userId);
        if (targetUser?.email) {
            await ctx.scheduler.runAfter(0, api.emailService.sendRoleChangeNotification, {
                email: targetUser.email,
                userName: targetUser.name || "User",
                newRole: args.role
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
                .first();

            let documentUrls: string[] = [];
            if (r.documents) {
                documentUrls = await Promise.all(
                    r.documents.map(async (id) => {
                        try {
                            const url = await ctx.storage.getUrl(id);
                            return url || id;
                        } catch {
                            return id;
                        }
                    })
                );
            }

            return { ...r, profiles: profile, documentUrls };
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

        const targetUser = await ctx.db.get(req.userId);
        if (!targetUser) throw new Error("User not found");

        await ctx.db.patch(args.requestId, {
            status: args.approve ? "approved" : "rejected",
            admin_notes: args.notes,
            updated_at: Date.now()
        });

        if (args.approve) {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", req.userId))
                .first();
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

        // Schedule notification email
        await ctx.scheduler.runAfter(0, api.emailService.sendVerificationResult, {
            email: targetUser.email!,
            userName: targetUser.name || "User",
            approved: args.approve,
            notes: args.notes
        });
    }
});

export const listPosts = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        // Return all posts, including hidden
        const posts = await ctx.db
            .query("posts")
            .withIndex("by_created_at")
            .order("desc")
            .take(100);
        return posts;
    }
});

export const listProducts = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        // Return all products
        return await ctx.db.query("products").order("desc").take(100);
    }
});

export const hidePost = mutation({
    args: { postId: v.id("posts"), hide: v.boolean() },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        await ctx.db.patch(args.postId, {
            is_hidden: args.hide
        });

        await logAdminAction(
            ctx,
            admin._id,
            args.hide ? "hide_post" : "unhide_post",
            args.postId,
            "post"
        );
    }
});

export const hideProduct = mutation({
    args: { productId: v.id("products"), hide: v.boolean() },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        await ctx.db.patch(args.productId, {
            is_hidden: args.hide
        });

        await logAdminAction(
            ctx,
            admin._id,
            args.hide ? "hide_product" : "unhide_product",
            args.productId,
            "product"
        );
    }
});


// Refactored to action to support bulk email orchestration
export const broadcastNotification = action({
    args: { title: v.string(), message: v.string(), sendEmail: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        const admin = await ctx.runQuery(api.admin.checkAdmin);
        if (!admin) throw new Error("Unauthorized: Admin access required");

        // Input validation
        if (args.title.length < 3 || args.title.length > 200) {
            throw new Error("Title must be between 3 and 200 characters");
        }

        if (args.message.length < 10 || args.message.length > 1000) {
            throw new Error("Message must be between 10 and 1000 characters");
        }

        // 1. In-app notifications (mutation)
        const emails = await ctx.runMutation(api.admin.createInAppBroadcast, {
            title: args.title,
            message: args.message
        });

        // 2. Email broadcast if requested
        if (args.sendEmail && emails.length > 0) {
            await ctx.runAction(api.emailService.sendBulkEmail, {
                to: emails,
                subject: args.title,
                message: args.message
            });
        }

        await ctx.runMutation(api.admin.createAuditLog, {
            adminId: admin._id,
            action: "broadcast_notification",
            targetType: "announcement",
            details: `${args.title}${args.sendEmail ? " (with email)" : ""}`
        });
    }
});

// Internal helper for broadcast action
export const createInAppBroadcast = mutation({
    args: { title: v.string(), message: v.string() },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const users = await ctx.db.query("users").collect();

        const notifications = users.map(user => ({
            userId: user._id,
            title: args.title,
            message: args.message,
            is_read: false,
            created_at: Date.now(),
            type: "announcement"
        }));

        await Promise.all(
            notifications.map(notification =>
                ctx.db.insert("notifications", notification)
            )
        );

        return users.map(u => u.email).filter(Boolean) as string[];
    }
});

export const listAuditLogs = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const logs = await ctx.db
            .query("admin_audit_logs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(50);

        return await Promise.all(logs.map(async (log) => {
            let adminName = "System";

            if (log.adminId !== "system") {
                const admin = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", log.adminId as any))
                    .first();
                adminName = admin?.full_name || "Unknown Admin";
            }

            return {
                ...log,
                adminName
            };
        }));
    }
});

export const listEmailLogs = query({
    args: {},
    handler: async (ctx) => {
        console.log("Admin listing email logs...");
        const admin = await ensureAdmin(ctx);
        console.log(`Admin authorized: ${admin.email}`);
        return await ctx.db
            .query("email_logs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(100);
    }
});
export const toggleFeatured = mutation({
    args: { productId: v.id("products"), featured: v.boolean(), durationDays: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const featured_until = args.featured
            ? Date.now() + (args.durationDays || 7) * 24 * 60 * 60 * 1000
            : undefined;

        await ctx.db.patch(args.productId, {
            is_featured: args.featured,
            featured_until,
        });

        await logAdminAction(
            ctx,
            admin._id,
            args.featured ? "feature_product" : "unfeature_product",
            args.productId,
            "product",
            `Duration: ${args.durationDays || 7} days`
        );
    }
});

export const sendMarketingMessage = action({
    args: {
        userIds: v.optional(v.array(v.id("users"))), // Optional: send to specific users or all
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const admin = await ctx.runQuery(api.admin.checkAdmin);
        if (!admin) throw new Error("Unauthorized");

        // 1. Get recipients
        let targetUserIds: any[] = args.userIds || [];
        if (!args.userIds) {
            const users = await ctx.runQuery(api.admin.listAllUserIdsForMarketing);
            targetUserIds = users;
        }

        // 2. Send in-app notifications & emails via internal mutation
        await ctx.runMutation(api.admin.createMarketingNotifications, {
            userIds: targetUserIds,
            title: args.title,
            message: args.message,
            link: args.link
        });

        // 3. Audit log
        await ctx.runMutation(api.admin.createAuditLog, {
            adminId: admin._id,
            action: "marketing_push",
            targetType: "system",
            details: `Marketing: ${args.title} to ${targetUserIds.length} users`
        });
    }
});

export const listAllUserIdsForMarketing = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const users = await ctx.db.query("users").take(100); // Limit users list
        return users.map(u => u._id);
    }
});

export const createMarketingNotifications = mutation({
    args: { userIds: v.array(v.id("users")), title: v.string(), message: v.string(), link: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const now = Date.now();

        for (const userId of args.userIds) {
            await ctx.db.insert("notifications", {
                userId,
                title: args.title,
                message: args.message,
                link: args.link,
                is_read: false,
                created_at: now,
                type: "marketing"
            });

            // Also send email if user has one
            const user = await ctx.db.get(userId);
            if (user?.email) {
                await ctx.scheduler.runAfter(0, api.emailService.sendMarketingEmail, {
                    email: user.email,
                    userName: user.name || "Valued User",
                    subject: args.title,
                    message: args.message,
                    link: args.link
                });
            }
        }
    }
});

export const generateDailyReport = mutation({
    args: {},
    handler: async (ctx) => {
        const yesterday = Date.now() - (24 * 60 * 60 * 1000);

        const newUsers = await ctx.db
            .query("users")
            .filter((q) => q.gt(q.field("_creationTime"), yesterday))
            .collect();

        const newOrders = await ctx.db
            .query("orders")
            .filter((q) => q.gt(q.field("created_at"), yesterday))
            .collect();

        const totalRevenue = newOrders.reduce((acc, order) => acc + (order.total_price || 0), 0);

        // Find admins to notify
        const admins = await ctx.db
            .query("user_roles")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();

        for (const admin of admins) {
            await ctx.db.insert("notifications", {
                userId: admin.userId,
                title: "Daily Platform Report",
                message: `Yesterday's Summary: ${newUsers.length} new users, ${newOrders.length} orders, Total Revenue: $${totalRevenue.toFixed(2)}`,
                is_read: false,
                created_at: Date.now(),
                type: "system"
            });
        }

        return {
            users: newUsers.length,
            orders: newOrders.length,
            revenue: totalRevenue
        };
    }
});
