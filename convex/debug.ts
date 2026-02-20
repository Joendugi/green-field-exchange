import { query } from "./_generated/server";

export const listAllRoles = query({
    args: {},
    handler: async (ctx) => {
        const roles = await ctx.db.query("user_roles").collect();
        const users = await ctx.db.query("users").collect();
        const profiles = await ctx.db.query("profiles").collect();

        return {
            roles: roles.map(role => {
                const user = users.find(u => u._id === role.userId);
                return { ...role, email: user?.email };
            }),
            profiles: profiles.map(p => ({
                userId: p.userId,
                count: profiles.filter(p2 => p2.userId === p.userId).length,
                username: p.username
            })).filter(p => p.count > 1)
        };
    },
});
