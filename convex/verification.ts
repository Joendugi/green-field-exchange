import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const getVerificationRequest = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("verification_requests")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return request;
  },
});

export const createVerificationRequest = mutation({
  args: {
    documents: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if request already exists
    const existingRequest = await ctx.db
      .query("verification_requests")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existingRequest) {
      throw new Error("Verification request already exists");
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("verification_requests", {
      userId: user._id,
      status: "pending",
      documents: args.documents,
      created_at: now,
      updated_at: now,
    });

    // Update profile to show verification requested
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        verification_requested: true,
        updated_at: now,
      });
    }

    return requestId;
  },
});

export const updateVerificationRequest = mutation({
  args: {
    requestId: v.id("verification_requests"),
    status: v.string(),
    admin_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const adminUser = await ctx.db.get(userId);
    if (!adminUser) {
      throw new Error("User not found");
    }

    // Check if user has admin role
    const adminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", adminUser._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!adminRole) {
      throw new Error("Not authorized");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Verification request not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: args.status,
      admin_notes: args.admin_notes,
      updated_at: now,
    });

    // Update profile if approved
    if (args.status === "approved") {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", request.userId))
        .first();

      if (profile) {
        await ctx.db.patch(profile._id, {
          verified: true,
          verification_requested: false,
          updated_at: now,
        });
      }
    }

    return args.requestId;
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const adminUser = await ctx.db.get(userId);
    if (!adminUser) {
      throw new Error("User not found");
    }

    // Check if user has admin role
    const adminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", adminUser._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!adminRole) {
      throw new Error("Not authorized");
    }

    const requests = await ctx.db
      .query("verification_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Get profiles and file URLs for each request
    const requestsWithProfiles = await Promise.all(
      requests.map(async (request) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", request.userId))
          .first();

        let documentUrls: string[] = [];
        if (request.documents) {
          documentUrls = await Promise.all(
            request.documents.map(async (id) => {
              // Check if it's a storage ID
              try {
                const url = await ctx.storage.getUrl(id);
                return url || id; // Fallback to original string if not a valid storage ID
              } catch {
                return id;
              }
            })
          );
        }

        return {
          ...request,
          profile,
          documentUrls,
        };
      })
    );

    return requestsWithProfiles;
  },
});
