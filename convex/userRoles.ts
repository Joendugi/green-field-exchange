import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserRole = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const role = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    return role?.role || "user";
  },
});

export const grantRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!adminUser) {
      throw new Error("User not found");
    }
    
    // Check if current user has admin role
    const adminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", adminUser._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!adminRole) {
      throw new Error("Not authorized");
    }
    
    // Check if role already exists
    const existingRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const now = Date.now();
    
    if (existingRole) {
      await ctx.db.patch(existingRole._id, {
        role: args.role,
        granted_by: adminUser._id,
        created_at: now,
      });
      return existingRole._id;
    } else {
      const roleId = await ctx.db.insert("user_roles", {
        userId: args.userId,
        role: args.role,
        granted_by: adminUser._id,
        created_at: now,
      });
      return roleId;
    }
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      return false;
    }
    
    const role = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    return !!role;
  },
});
