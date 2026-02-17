import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensureAuthenticated, ensureAdmin } from "./helpers";

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return profile;
  },
});

export const createProfile = mutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
    full_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    // Check if username is taken
    const existingUsername = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUsername) {
      throw new Error("Username already taken");
    }

    const profileId = await ctx.db.insert("profiles", {
      ...args,
      verified: false,
      verification_requested: false,
      onboarded: false,
      created_at: now,
      updated_at: now,
    });

    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    full_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const callerId = await ensureAuthenticated(ctx);

    // Only allow users to update their own profile, unless caller is an admin.
    if (callerId !== args.userId) {
      const admin = await ensureAdmin(ctx);
      // Admins can update any profile; non-admins cannot update others.
      if (admin._id !== callerId) {
        throw new Error("Unauthorized");
      }
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Check if new username is taken (if provided)
    if (args.username && args.username !== profile.username) {
      const existingUsername = await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      if (existingUsername) {
        throw new Error("Username already taken");
      }
    }

    const now = Date.now();
    const updateData: any = { updated_at: now };

    // Only update provided fields
    if (args.username !== undefined) updateData.username = args.username;
    if (args.full_name !== undefined) updateData.full_name = args.full_name;
    if (args.avatar_url !== undefined) updateData.avatar_url = args.avatar_url;
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.website !== undefined) updateData.website = args.website;

    await ctx.db.patch(profile._id, updateData);

    return profile._id;
  },
});

export const getProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    return profile;
  },
});

export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return null;

    // Return only public fields
    return {
      userId: profile.userId,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      location: profile.location,
      verified: profile.verified,
    };
  },
});

export const setOnboarded = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      onboarded: true,
      updated_at: Date.now(),
    });

    return profile._id;
  },
});
