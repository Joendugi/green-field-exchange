/**
 * Convex Type Aliases
 *
 * This file exports named type aliases for common Convex document types.
 * Use these instead of `any` when working with Convex data to get full
 * TypeScript support and catch bugs at compile time.
 *
 * Usage:
 *   import type { UserDoc, ProfileDoc, OrderDoc } from "@/types/convex";
 */

import type { Doc, Id } from "../../convex/_generated/dataModel";

// ─── Core Entities ───────────────────────────────────────────────────────────
export type UserDoc = Doc<"users">;
export type ProfileDoc = Doc<"profiles">;
export type UserRoleDoc = Doc<"user_roles">;
export type UserSettingsDoc = Doc<"user_settings">;

// ─── Marketplace ─────────────────────────────────────────────────────────────
export type ProductDoc = Doc<"products">;
export type OrderDoc = Doc<"orders">;
export type ReviewDoc = Doc<"reviews">;
export type PriceHistoryDoc = Doc<"price_history">;

// ─── Social ──────────────────────────────────────────────────────────────────
export type PostDoc = Doc<"posts">;
export type PostLikeDoc = Doc<"post_likes">;
export type PostCommentDoc = Doc<"post_comments">;
export type PostRepostDoc = Doc<"post_reposts">;
export type FollowDoc = Doc<"follows">;

// ─── Messaging & Notifications ───────────────────────────────────────────────
export type MessageDoc = Doc<"messages">;
export type ConversationDoc = Doc<"conversations">;
export type NotificationDoc = Doc<"notifications">;

// ─── Admin ───────────────────────────────────────────────────────────────────
export type AdminSettingsDoc = Doc<"admin_settings">;
export type AdminAuditLogDoc = Doc<"admin_audit_logs">;
export type VerificationRequestDoc = Doc<"verification_requests">;
export type AdvertisementDoc = Doc<"advertisements">;

// ─── Auth & Security ─────────────────────────────────────────────────────────
export type PasswordResetTokenDoc = Doc<"password_reset_tokens">;
export type LoginAttemptDoc = Doc<"login_attempts">;

// ─── ID Aliases (for prop types) ─────────────────────────────────────────────
export type UserId = Id<"users">;
export type ProductId = Id<"products">;
export type OrderId = Id<"orders">;
export type PostId = Id<"posts">;
export type ConversationId = Id<"conversations">;
export type VerificationRequestId = Id<"verification_requests">;
export type AdvertisementId = Id<"advertisements">;
