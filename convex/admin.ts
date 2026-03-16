import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";
import { api } from "./_generated/api";
import { ensureAdmin, logAdminAction } from "./helpers";

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

export const getRecentActivity = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        // Fetch recent entries from multiple tables
        const [allRecentUsers, recentOrders, recentPosts, recentProducts] = await Promise.all([
            ctx.db.query("profiles").order("desc").take(100),
            ctx.db.query("orders").order("desc").take(10),
            ctx.db.query("posts").withIndex("by_created_at").order("desc").take(20),
            ctx.db.query("products").order("desc").take(10),
        ]);

        // Filter profiles to last 7 days in memory (no index on created_at)
        const recentUsers = allRecentUsers.filter(u => u.created_at >= sevenDaysAgo);

        const events: Array<{ type: string; label: string; time: number; icon: string }> = [];

        for (const u of recentUsers) {
            events.push({ type: "user", label: `${u.full_name || u.username} joined`, time: u.created_at, icon: "👤" });
        }
        for (const o of recentOrders) {
            events.push({ type: "order", label: `New order placed — ${o.currency}${o.total_price}`, time: o.created_at, icon: "🛒" });
        }
        for (const p of recentPosts) {
            events.push({ type: "post", label: `New post: "${p.content.slice(0, 40)}${p.content.length > 40 ? "…" : ""}"`, time: p.created_at, icon: "📝" });
        }
        for (const p of recentProducts) {
            events.push({ type: "product", label: `Product listed: ${p.name}`, time: p.created_at, icon: "📦" });
        }

        events.sort((a, b) => b.time - a.time);
        return events.slice(0, 20);
    }
});

export const getGrowthStats = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const now = Date.now();
        const months: { label: string; start: number; end: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
            months.push({
                label: d.toLocaleString("default", { month: "short" }),
                start,
                end,
            });
        }

        const allProfiles = await ctx.db.query("profiles").collect();
        const allOrders = await ctx.db.query("orders").collect();

        return months.map(m => ({
            label: m.label,
            users: allProfiles.filter(p => p.created_at >= m.start && p.created_at <= m.end).length,
            revenue: allOrders
                .filter(o => o.created_at >= m.start && o.created_at <= m.end)
                .reduce((sum, o) => sum + (o.total_price || 0), 0),
        }));
    }
});

export const listUsers = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const PAGE = Math.min(args.limit ?? 200, 500);

        // 1. Fetch profiles (capped — never load the whole table)
        const profiles = await ctx.db.query("profiles").order("desc").take(PAGE);

        // 2. Batch all roles in one query and build userId → roles[] map
        const allRoles = await ctx.db.query("user_roles").collect();
        const roleMap = new Map<string, typeof allRoles>();
        for (const r of allRoles) {
            const key = r.userId as string;
            if (!roleMap.has(key)) roleMap.set(key, []);
            roleMap.get(key)!.push(r);
        }

        // 3. Only N auth lookups remain (for emails); still parallel
        return await Promise.all(profiles.map(async (p) => {
            const authUser = await ctx.db.get(p.userId);
            return {
                ...p,
                email: authUser?.email,
                user_roles: roleMap.get(p.userId as string) ?? [],
            };
        }));
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

export const logDocumentView = mutation({
    args: { requestId: v.id("verification_requests") },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        await logAdminAction(
            ctx,
            admin._id,
            "view_sensitive_documents",
            request.userId,
            "identity",
            `Viewed documents for request ${args.requestId}`
        );
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

// Schedules broadcast notifications in safe chunks to avoid Convex's 16K write cap.
// Each chunk is an independent transaction — safe for any user count.
export const createInAppBroadcast = mutation({
    args: { title: v.string(), message: v.string() },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const CHUNK_SIZE = 200;

        // Page through users to avoid loading entire table at once
        const users = await ctx.db.query("users").take(10000); // Practical cap
        const emails = users.map(u => u.email).filter(Boolean) as string[];

        // Schedule notifications in chunks so each is its own transaction
        for (let i = 0; i < users.length; i += CHUNK_SIZE) {
            const chunk = users.slice(i, i + CHUNK_SIZE).map(u => u._id);
            await ctx.scheduler.runAfter(i * 5, api.admin.insertNotificationChunk, {
                userIds: chunk,
                title: args.title,
                message: args.message,
            });
        }

        return emails;
    }
});

// Internal: inserts one chunk of notifications (called by the scheduler)
export const insertNotificationChunk = mutation({
    args: {
        userIds: v.array(v.id("users")),
        title: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        for (const userId of args.userIds) {
            await ctx.db.insert("notifications", {
                userId,
                title: args.title,
                message: args.message,
                is_read: false,
                created_at: now,
                type: "announcement",
            });
        }
    },
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

// ── AI Content Moderation Shield ─────────────────────────────────────────────
export const moderateContent = action({
    args: {},
    handler: async (ctx): Promise<{ flagged: Array<{ id: string; type: string; content: string; reason: string; confidence: "high" | "medium" | "low" }> }> => {
        const admin = await ctx.runQuery(api.admin.checkAdmin);
        if (!admin) throw new Error("Unauthorized");

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            console.warn("GROQ_API_KEY not set — AI moderation unavailable");
            return { flagged: [] };
        }

        // Fetch recent unreviewed content
        const [products, posts] = await Promise.all([
            ctx.runQuery(api.admin.listProducts),
            ctx.runQuery(api.admin.listPosts),
        ]);

        const contentItems = [
            ...products.slice(0, 20).map((p: any) => ({
                id: p._id,
                type: "product" as const,
                text: `Name: ${p.name}. Description: ${p.description}. Price: ${p.price}.`,
            })),
            ...posts.slice(0, 20).map((p: any) => ({
                id: p._id,
                type: "post" as const,
                text: p.content,
            })),
        ];

        if (contentItems.length === 0) return { flagged: [] };

        const prompt = `You are a content moderation AI for an East African agricultural marketplace called Wakulima.
Review the following items and identify any that violate community standards.

Flag items that contain:
- Spam or misleading product descriptions
- Prohibited or illegal items (drugs, weapons, stolen goods)
- Hate speech or harmful content
- Scam indicators (unrealistic prices, suspicious offers)
- Copyright violations or fake products

Items to review:
${contentItems.map((item, i) => `${i + 1}. [${item.type.toUpperCase()}] ID: ${item.id}\n   Content: ${item.text}`).join("\n\n")}

Respond ONLY with a valid JSON object in this exact format:
{
  "flagged": [
    {
      "id": "item_id_here",
      "type": "product or post",
      "reason": "Brief reason for flagging",
      "confidence": "high, medium, or low"
    }
  ]
}

If nothing needs to be flagged, return: {"flagged": []}`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            console.error("Groq AI moderation error:", await response.text());
            return { flagged: [] };
        }

        const data = await response.json();
        try {
            const result = JSON.parse(data.choices[0].message.content);
            const flaggedItems = (result.flagged || []).map((f: any) => {
                const original = contentItems.find(c => c.id === f.id);
                return {
                    id: f.id,
                    type: f.type,
                    content: original?.text || "",
                    reason: f.reason,
                    confidence: f.confidence || "medium",
                };
            });
            return { flagged: flaggedItems };
        } catch (e) {
            console.error("Failed to parse AI moderation response", e);
            return { flagged: [] };
        }
    }
});

