// Setup script for creating the first admin user
// Run this in Convex dashboard or as a one-time migration

import { mutation } from "./convex/_generated/server";
import { v } from "convex/values";

const createFirstAdmin = mutation({
  args: { 
    userEmail: v.string() // Email of the user to make admin
  },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();
    
    if (!user) {
      throw new Error(`User with email ${args.userEmail} not found. Please create the user account first.`);
    }

    // Check if already admin
    const existingAdmin = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdmin) {
      console.log("User is already an admin");
      return { success: true, alreadyAdmin: true };
    }

    // Grant admin role (self-granted for first admin setup)
    await ctx.db.insert("user_roles", {
      userId: user._id,
      role: "admin",
      granted_by: user._id, // Self-granted for initial setup
      created_at: Date.now(),
    });

    // Log the action
    await ctx.db.insert("admin_audit_logs", {
      adminId: user._id,
      action: "create_first_admin",
      targetId: user._id,
      targetType: "user",
      details: `Created first admin: ${args.userEmail}`,
      timestamp: Date.now(),
    });

    console.log(`Admin privileges granted to ${args.userEmail}`);
    return { success: true, userId: user._id };
  },
});

// INSTRUCTIONS:
// 1. Go to your Convex dashboard
// 2. Open the mutation runner
// 3. Run: await createFirstAdmin({ userEmail: "your-email@example.com" })
// 4. The user will now have admin privileges
