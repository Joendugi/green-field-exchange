/**
 * ADMIN SETUP — CLI USE ONLY
 *
 * This mutation is intended for initial admin bootstrapping only.
 * After the first admin is created, use the Admin Dashboard to manage roles.
 *
 * Usage (CLI only):
 *   npx convex run --prod setup_admin:createFirstAdmin '{"userEmail":"you@example.com"}'
 *
 * WARNING: This mutation has no auth check by design so the very first admin
 * can be seeded. Once your first admin exists, delete or restrict this file.
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createFirstAdmin = mutation({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Safeguard: only allow seeding if no admins exist yet,
    // or if caller is already an admin.
    const existingAdmins = await ctx.db
      .query("user_roles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    const callerIdentity = await ctx.auth.getUserIdentity();
    const isAuthorized =
      existingAdmins.length === 0 || // Allow if bootstrapping
      (callerIdentity && existingAdmins.some((r) => r.userId === callerIdentity.subject));

    if (!isAuthorized) {
      throw new Error("Unauthorized: An admin already exists. Use the Admin Dashboard to manage roles.");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.userEmail} not found. Please create the account first.`);
    }

    const existingAdminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdminRole) {
      console.log("User is already an admin.");
      return { success: true, alreadyAdmin: true };
    }

    await ctx.db.insert("user_roles", {
      userId: user._id,
      role: "admin",
      granted_by: user._id,
      created_at: Date.now(),
    });

    await ctx.db.insert("admin_audit_logs", {
      adminId: user._id,
      action: "create_first_admin",
      targetId: user._id,
      targetType: "user",
      details: `Bootstrapped admin: ${args.userEmail}`,
      timestamp: Date.now(),
    });

    console.log(`Admin privileges granted to ${args.userEmail}`);
    return { success: true, userId: user._id };
  },
});
