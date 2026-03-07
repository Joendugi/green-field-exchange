import type { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id, Doc } from "./_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Ensure the caller is authenticated and return their userId.
 */
export async function ensureAuthenticated(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Ensure the caller has an admin role and return their user document.
 */
export async function ensureAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const userId = await ensureAuthenticated(ctx);

  const roleData = await ctx.db
    .query("user_roles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "admin"))
    .first();

  if (!roleData) {
    throw new Error("Admin privileges required");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Verify that the current user is a participant in the given conversation.
 * Returns the conversation document if authorized.
 */
export async function assertConversationParticipant(
  ctx: Ctx,
  conversationId: Id<"conversations">,
  userId: Id<"users">
): Promise<Doc<"conversations">> {
  const conversation = await ctx.db.get(conversationId);
  if (
    !conversation ||
    (conversation.participant1_id !== userId &&
      conversation.participant2_id !== userId)
  ) {
    throw new Error("Unauthorized");
  }

  return conversation;
}

/**
 * Verify that the current user owns the given notification.
 * Returns the notification document if authorized.
 */
export async function assertNotificationOwner(
  ctx: Ctx,
  notificationId: Id<"notifications">,
  userId: Id<"users">
): Promise<Doc<"notifications">> {
  const notification = await ctx.db.get(notificationId);
  if (!notification || notification.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return notification;
}

/**
 * Log an administrative action to the audit logs.
 */
export async function logAdminAction(
  ctx: MutationCtx,
  adminId: Id<"users">,
  action: string,
  targetId?: string,
  targetType: string = "system",
  details?: string
) {
  await ctx.db.insert("admin_audit_logs", {
    adminId,
    action,
    targetId,
    targetType,
    details,
    timestamp: Date.now(),
  });
}
