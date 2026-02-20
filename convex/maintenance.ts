/**
 * MAINTENANCE SCRIPTS — CLI USE ONLY
 *
 * These mutations are designed to be run via the Convex CLI by an authenticated admin:
 *   npx convex run --prod maintenance:deduplicateUserRoles
 *   npx convex run --prod maintenance:deduplicateProfiles
 *
 * Auth is enforced — the caller must be a logged-in admin.
 * Do NOT expose these via the frontend UI.
 */
import { mutation } from "./_generated/server";
import { ensureAdmin } from "./helpers";

export const deduplicateUserRoles = mutation({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const allRoles = await ctx.db.query("user_roles").collect();
        const userRoleMap = new Map<string, any[]>();

        for (const roleEntry of allRoles) {
            const roles = userRoleMap.get(roleEntry.userId) || [];
            roles.push(roleEntry);
            userRoleMap.set(roleEntry.userId, roles);
        }

        let deletedCount = 0;
        for (const [userId, roles] of userRoleMap.entries()) {
            if (roles.length > 1) {
                console.log(`Found ${roles.length} roles for user ${userId}.`);

                // Always keep the "admin" role; otherwise keep oldest
                const sorted = [...roles].sort((a, b) => {
                    if (a.role === "admin" && b.role !== "admin") return -1;
                    if (a.role !== "admin" && b.role === "admin") return 1;
                    return a.created_at - b.created_at;
                });

                const [keep, ...toDelete] = sorted;
                console.log(`Keeping role: ${keep.role} (ID: ${keep._id})`);

                for (const entry of toDelete) {
                    await ctx.db.delete(entry._id);
                    deletedCount++;
                }
            }
        }

        console.log(`Maintenance complete. Deleted ${deletedCount} duplicate role entries.`);
        return { success: true, deletedCount };
    },
});

export const deduplicateProfiles = mutation({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const allProfiles = await ctx.db.query("profiles").collect();
        const profileMap = new Map<string, any[]>();

        for (const p of allProfiles) {
            const ps = profileMap.get(p.userId) || [];
            ps.push(p);
            profileMap.set(p.userId, ps);
        }

        let deletedCount = 0;
        for (const [userId, ps] of profileMap.entries()) {
            if (ps.length > 1) {
                console.log(`Found ${ps.length} profiles for user ${userId}. Keeping the newest.`);
                const sorted = [...ps].sort((a, b) => b.updated_at - a.updated_at);
                const [, ...toDelete] = sorted;
                for (const entry of toDelete) {
                    await ctx.db.delete(entry._id);
                    deletedCount++;
                }
            }
        }

        console.log(`Profile maintenance complete. Deleted ${deletedCount} duplicate profile entries.`);
        return { success: true, deletedCount };
    },
});
