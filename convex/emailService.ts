import { mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Send password reset email
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    resetLink: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In a real implementation, you would use an email service like SendGrid, Nodemailer, etc.
    // For now, we'll simulate email sending and return success

    console.log(`📧 Sending password reset email to: ${args.email}`);
    console.log(`🔗 Reset link: ${args.resetLink}`);
    console.log(`👤 User name: ${args.userName || 'User'}`);

    // Log the email send for audit purposes
    await ctx.db.insert("admin_audit_logs", {
      adminId: "system", // System-generated action
      action: "send_password_reset_email",
      targetId: args.email,
      targetType: "email",
      details: `Password reset email sent to ${args.email} with link ${args.resetLink}`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "Password reset email sent successfully",
      email: args.email,
      resetLink: args.resetLink,
      timestamp: Date.now()
    };
  },
});

// Send welcome email after account creation
export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    userName: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`📧 Sending welcome email to: ${args.email}`);
    console.log(`👤 User: ${args.userName}`);
    console.log(`🌾 Role: ${args.role}`);

    // Log the email send
    await ctx.db.insert("admin_audit_logs", {
      adminId: "system",
      action: "send_welcome_email",
      targetId: args.email,
      targetType: "email",
      details: `Welcome email sent to ${args.email} for ${args.role} account`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
      email: args.email,
      role: args.role,
      timestamp: Date.now()
    };
  },
});

// Send verification request confirmation
export const sendVerificationConfirmation = action({
  args: {
    email: v.string(),
    userName: v.string(),
    documents: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    console.log(`📧 Sending verification confirmation to: ${args.email}`);
    console.log(`📄 Documents: ${args.documents?.length || 0} files`);

    // Log the email send
    await ctx.db.insert("admin_audit_logs", {
      adminId: "system",
      action: "send_verification_confirmation",
      targetId: args.email,
      targetType: "email",
      details: `Verification confirmation sent to ${args.email} with ${args.documents?.length || 0} documents`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "Verification confirmation sent successfully",
      email: args.email,
      documentsCount: args.documents?.length || 0,
      timestamp: Date.now()
    };
  },
});

// Email templates for different purposes
export const emailTemplates = {
  passwordReset: {
    subject: "Reset your AgriLink password",
    html: (resetLink: string, userName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2d3748; font-size: 24px; margin-bottom: 20px;">🔐 Password Reset Request</h1>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">We received a request to reset your AgriLink account password.</p>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 30px;">Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour for security reasons.</p>
          <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">If you didn't request this reset, please ignore this email.</p>
          <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">For support, contact us at support@agrilink.global</p>
        </div>
      </div>
    `,
  },

  welcome: {
    subject: "Welcome to AgriLink!",
    html: (userName: string, role: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #22c55e; font-size: 24px; margin-bottom: 20px;">🌱 Welcome to AgriLink!</h1>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Welcome to the future of sustainable agriculture! Your ${role} account has been successfully created.</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #16a34a; margin-bottom: 10px;">🚀 Getting Started</h3>
            <ul style="color: #4a5568; line-height: 1.6;">
              <li>✅ Complete your profile to connect with buyers</li>
              <li>✅ List your products and reach global markets</li>
              <li>✅ Use AI insights to optimize your farming decisions</li>
              <li>✅ Join our community of sustainable farmers</li>
            </ul>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">Need help? Contact our support team at support@agrilink.global</p>
        </div>
      </div>
    `,
  },

  verificationConfirmation: {
    subject: "AgriLink - Verification Request Received",
    html: (userName: string, documentCount: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2d3748; font-size: 24px; margin-bottom: 20px;">📋 Verification Request Received</h1>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">We've received your verification request with ${documentCount} document(s). Our team will review your submission within 24-48 hours.</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #16a34a; margin-bottom: 10px;">📝 What's Next?</h3>
            <ol style="color: #4a5568; line-height: 1.6;">
              <li>Our team reviews your documents and farm information</li>
              <li>You'll receive an email once verification is complete</li>
              <li>Start listing products and connecting with buyers</li>
              <li>Access premium features and AI insights</li>
            </ol>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">Questions? Contact us at support@agrilink.global</p>
        </div>
      </div>
    `,
  }
};
