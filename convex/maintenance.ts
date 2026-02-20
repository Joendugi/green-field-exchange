import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ensureAdmin } from "./helpers";

export const deduplicateUserRoles = mutation({
    args: {},
    handler: async (ctx) => {
        // const admin = await ensureAdmin(ctx);
        console.log(`Maintenance started via CLI`);

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

                // Prioritize keeping "admin" role
                const sortedRoles = [...roles].sort((a, b) => {
                    // Admin role comes first
                    if (a.role === "admin" && b.role !== "admin") return -1;
                    if (a.role !== "admin" && b.role === "admin") return 1;
                    // Otherwise oldest first
                    return a.created_at - b.created_at;
                });

                const [keep, ...toDelete] = sortedRoles;
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
        // const admin = await ensureAdmin(ctx);
        console.log(`Profile maintenance started via CLI`);

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
                console.log(`Found ${ps.length} profiles for user ${userId}. Keeping the newest one.`);
                // Favor the newest profile as it's likely the one with more data
                const sorted = [...ps].sort((a, b) => b.updated_at - a.updated_at);
                const [keep, ...toDelete] = sorted;

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
