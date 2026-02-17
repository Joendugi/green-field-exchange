// Script to grant admin privileges to a user
// Run this in the Convex dashboard or as a one-time migration

import { mutation } from "./convex/_generated/server";
import { v } from "convex/values";

const grantAdminPrivileges = mutation({
  args: { 
    userEmail: v.string(), // User's email address
    grantedBy: v.id("users") // Admin user ID who is granting privileges
  },
  handler: async (ctx, args) => {
    // Find the user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();
    
    if (!user) {
      throw new Error(`User with email ${args.userEmail} not found`);
    }

    // Check if user already has admin role
    const existingRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingRole) {
      throw new Error("User already has admin privileges");
    }

    // Grant admin role
    await ctx.db.insert("user_roles", {
      userId: user._id,
      role: "admin",
      granted_by: args.grantedBy,
      created_at: Date.now(),
    });

    // Log the action
    await ctx.db.insert("admin_audit_logs", {
      adminId: args.grantedBy,
      action: "grant_admin",
      targetId: user._id,
      targetType: "user",
      details: `Granted admin privileges to ${args.userEmail}`,
      timestamp: Date.now(),
    });

    return { success: true, userId: user._id };
  },
});

// Usage example:
// In Convex dashboard, run:
// await grantAdminPrivileges({ userEmail: "user@example.com", grantedBy: "YOUR_ADMIN_USER_ID" });
