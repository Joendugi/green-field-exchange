import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("user_settings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    return settings;
  },
});

export const createOrUpdateSettings = mutation({
  args: {
    email_notifications: v.optional(v.boolean()),
    push_notifications: v.optional(v.boolean()),
    theme: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const existingSettings = await ctx.db
      .query("user_settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    
    const now = Date.now();
    
    if (existingSettings) {
      // Update existing settings
      const updateData: any = { updated_at: now };
      
      if (args.email_notifications !== undefined) {
        updateData.email_notifications = args.email_notifications;
      }
      if (args.push_notifications !== undefined) {
        updateData.push_notifications = args.push_notifications;
      }
      if (args.theme !== undefined) {
        updateData.theme = args.theme;
      }
      if (args.language !== undefined) {
        updateData.language = args.language;
      }
      
      await ctx.db.patch(existingSettings._id, updateData);
      return existingSettings._id;
    } else {
      // Create new settings with defaults
      const settingsId = await ctx.db.insert("user_settings", {
        userId: user._id,
        email_notifications: args.email_notifications ?? true,
        push_notifications: args.push_notifications ?? true,
        theme: args.theme ?? "light",
        language: args.language ?? "en",
        created_at: now,
        updated_at: now,
      });
      
      return settingsId;
    }
  },
});
