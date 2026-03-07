import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { ensureAdmin, logAdminAction } from "./helpers";

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

    // Security check: Validate that storage IDs actually exist
    if (args.documents) {
      for (const id of args.documents) {
        try {
          const metadata = await ctx.storage.getMetadata(id);
          if (!metadata) throw new Error("Metadata not found");
        } catch (e) {
            throw new Error(`Security violation: Invalid or inaccessible document ${id}`);
        }
      }
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
    const adminUser = await ensureAdmin(ctx);

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

    // Audit log
    await logAdminAction(
        ctx,
        adminUser._id,
        args.status === "approved" ? "approve_verification" : "reject_verification",
        request.userId,
        "identity",
        `Request ${args.requestId}: ${args.admin_notes || "No notes"}`
    );

    return args.requestId;
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    await ensureAdmin(ctx);

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
