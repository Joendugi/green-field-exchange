import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { emailTemplates } from "./emailService";
import { checkPasswordResetLimit } from "./rateLimiting";

// Request password reset
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit first
    await checkPasswordResetLimit(ctx, { email: args.email });
    
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      // Don't reveal if email exists or not for security
      const resetLink = `https://your-domain.com/password-reset?token=dummy-token`;
      
      // Send email (simulated)
      await ctx.scheduler.runAfter(0, emailService.sendPasswordResetEmail, {
        email: args.email,
        resetLink,
        userName: user.username || "User"
      });
      
      return { 
        success: true, 
        message: "If an account with this email exists, a reset link has been sent." 
      };
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour expiry

    // Store reset token
    await ctx.db.insert("password_reset_tokens", {
      userId: user._id,
      token: resetToken,
      expiresAt: expiryTime,
      createdAt: Date.now(),
    });

    // Generate reset link
    const resetLink = `https://your-domain.com/password-reset?token=${resetToken}`;

    // Log the action
    await ctx.db.insert("admin_audit_logs", {
      adminId: "system",
      action: "send_password_reset_email",
      targetId: args.email,
      targetType: "email",
      details: `Password reset email sent to ${args.email}`,
      timestamp: Date.now(),
    });

    // Send reset email
    await ctx.scheduler.runAfter(0, emailService.sendPasswordResetEmail, {
      email: args.email,
      resetLink,
      userName: user.username || "User"
    });

    return { 
      success: true, 
      message: "Password reset link sent to your email",
      email: args.email,
      resetLink
    };
  },
});

// Reset password with token
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Find valid reset token
    const resetToken = await ctx.db
      .query("password_reset_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    if (resetToken.expiresAt < Date.now()) {
      throw new Error("Reset token has expired");
    }

    // Validate new password
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Get user from token
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), resetToken.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Update user password (in production, use bcrypt)
    await ctx.db.patch(user._id, {
      password: args.newPassword, // In production: await bcrypt.hash(args.newPassword)
    });

    // Delete used token
    await ctx.db.delete(resetToken._id);

    // Log the action
    await ctx.db.insert("admin_audit_logs", {
      adminId: "system",
      action: "password_reset_completed",
      targetId: user._id,
      targetType: "user",
      details: `Password reset completed for user ${user.email}`,
      timestamp: Date.now(),
    });

    return { success: true, message: "Password reset successfully" };
  },
});

// Verify reset token
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
