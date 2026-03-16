import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { checkRateLimit } from "./rateLimiting";

// Request password reset
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
    origin: v.optional(v.string()), // Accept origin from client
  },
  handler: async (ctx, args) => {
    console.log(`🔑 Password reset requested for: ${args.email}`);
    // Check rate limit first
    await checkRateLimit(ctx, `password_reset:${args.email}`, "password_reset_request");

    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      // Don't reveal if email exists or not for security
      // Even for non-existent users, we simulate sending (or just return success)
      return {
        success: true,
        message: "If an account with this email exists, a reset code has been sent."
      };
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour expiry

    // Delete any existing tokens for this user to keep it clean
    const existingTokens = await ctx.db
      .query("password_reset_tokens")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const t of existingTokens) {
      await ctx.db.delete(t._id);
    }

    // Store OTP as the token
    await ctx.db.insert("password_reset_tokens", {
      userId: user._id,
      token: otp,
      expiresAt: expiryTime,
      createdAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert("admin_audit_logs", {
      adminId: user._id,
      action: "send_password_reset_otp",
      targetId: args.email,
      targetType: "email",
      details: `Password reset OTP sent to ${args.email}`,
      timestamp: Date.now(),
    });

    console.log(`✉️ Scheduling reset email for ${args.email} with OTP ${otp}`);
    // Send reset email with OTP
    await ctx.scheduler.runAfter(0, api.emailService.sendPasswordResetEmail, {
      email: args.email,
      otp,
      userName: user.name || "User"
    });

    return {
      success: true,
      message: "Password reset code sent to your email",
      email: args.email,
    };
  },
});

// Reset password with OTP or token
export const resetPassword = mutation({
  args: {
    email: v.optional(v.string()),
    otp: v.optional(v.string()),
    token: v.optional(v.string()), // For backward compatibility if needed
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    let userId: any = null;
    let tokenId: any = null;

    if (args.token) {
      // Token flow
      const resetToken = await ctx.db
        .query("password_reset_tokens")
        .withIndex("by_token", (q) => q.eq("token", args.token!))
        .first();

      if (!resetToken || resetToken.expiresAt < Date.now()) {
        throw new Error("Invalid or expired reset token");
      }
      userId = resetToken.userId;
      tokenId = resetToken._id;
    } else if (args.email && args.otp) {
      // OTP flow
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email!))
        .first();

      if (!user) throw new Error("User not found");

      const resetToken = await ctx.db
        .query("password_reset_tokens")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("token"), args.otp!))
        .first();

      if (!resetToken || resetToken.expiresAt < Date.now()) {
        throw new Error("Invalid or expired reset code");
      }
      userId = user._id;
      tokenId = resetToken._id;
    } else {
      throw new Error("Missing reset credentials");
    }

    // Validate new password
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // NOTE: This app uses Supabase Auth for password management.
    // The actual password update is done on the frontend via
    // supabase.auth.updateUser({ password: newPassword }).
    // This mutation only validates the OTP/token and cleans it up.

    // Delete used token
    await ctx.db.delete(tokenId);

    // Log the action
    await ctx.db.insert("admin_audit_logs", {
      adminId: userId,
      action: "password_reset_completed",
      targetId: userId,
      targetType: "user",
      details: `Password reset completed for user ${(user as any).email || 'unknown'}`,
      timestamp: Date.now(),
    });

    return { success: true, message: "Password reset verified. You may now update your password." };
  },
});

// Verify OTP
export const verifyOTP = query({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) return { valid: false, message: "User not found" };

    const resetToken = await ctx.db
      .query("password_reset_tokens")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("token"), args.otp))
      .first();

    if (!resetToken) {
      return { valid: false, message: "Invalid reset code" };
    }

    if (resetToken.expiresAt < Date.now()) {
      return { valid: false, message: "Reset code has expired" };
    }

    return { valid: true, message: "Code is valid" };
  },
});

// Deprecated verifyResetToken (kept for link-based flow support)
export const verifyResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("password_reset_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken) {
      return { valid: false, message: "Invalid reset token" };
    }

    if (resetToken.expiresAt < Date.now()) {
      return { valid: false, message: "Reset token has expired" };
    }

    return { valid: true, message: "Token is valid" };
  },
});

export const cleanupExpiredTokens = mutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("password_reset_tokens")
      .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const token of expired) {
      await ctx.db.delete(token._id);
    }
    return expired.length;
  },
});
