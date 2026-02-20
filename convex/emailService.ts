import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to send email via Resend API
async function sendEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not set. Falling back to console logging.");
    console.log(`📧 [MOCK EMAIL] To: ${args.to}, Subject: ${args.subject}`);
    return { success: true, mock: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AgriLink <onboarding@resend.dev>", // Using Resend's default sender for initial integration
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return { success: false, error };
  }
}

// Send password reset email
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    resetLink: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`📧 Sending password reset email to: ${args.email}`);

    const html = emailTemplates.passwordReset.html(args.resetLink, args.userName || "User");
    const result = await sendEmail({
      to: args.email,
      subject: emailTemplates.passwordReset.subject,
      html
    });

    // Log the email send for audit purposes
    await ctx.runMutation(api.admin.createAuditLog, {
      adminId: "system", // System-generated action
      action: "send_password_reset_email",
      targetId: args.email,
      targetType: "email",
      details: result.success
        ? `Password reset email sent successfully (ID: ${result.id || 'MOCK'})`
        : `Failed to send password reset email: ${JSON.stringify(result.error)}`,
    });

    return {
      success: result.success,
      message: result.success ? "Password reset email sent successfully" : "Failed to send email",
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

    const html = emailTemplates.welcome.html(args.userName, args.role);
    const result = await sendEmail({
      to: args.email,
      subject: emailTemplates.welcome.subject,
      html
    });

    // Log the email send
    await ctx.runMutation(api.admin.createAuditLog, {
      adminId: "system",
      action: "send_welcome_email",
      targetId: args.email,
      targetType: "email",
      details: result.success
        ? `Welcome email sent successfully (ID: ${result.id || 'MOCK'})`
        : `Failed to send welcome email: ${JSON.stringify(result.error)}`,
    });

    return {
      success: result.success,
      message: result.success ? "Welcome email sent successfully" : "Failed to send email",
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

    const html = emailTemplates.verificationConfirmation.html(args.userName, args.documents?.length || 0);
    const result = await sendEmail({
      to: args.email,
      subject: emailTemplates.verificationConfirmation.subject,
      html
    });

    // Log the email send
    await ctx.runMutation(api.admin.createAuditLog, {
      adminId: "system",
      action: "send_verification_confirmation",
      targetId: args.email,
      targetType: "email",
      details: result.success
        ? `Verification confirmation sent successfully (ID: ${result.id || 'MOCK'})`
        : `Failed to send verification confirmation: ${JSON.stringify(result.error)}`,
    });

    return {
      success: result.success,
      message: result.success ? "Verification confirmation sent successfully" : "Failed to send email",
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
  },

  orderConfirmation: {
    subject: (isFarmer: boolean, orderId: string) =>
      isFarmer ? `New Order Received #${orderId}` : `Order Confirmation #${orderId}`,
    html: (userName: string, orderId: string, details: { productName: string, quantity: number, unit: string, currency: string, totalPrice: number }, isFarmer: boolean) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #22c55e; font-size: 24px; margin-bottom: 20px;">📦 ${isFarmer ? 'New Order' : 'Order Confirmed'}</h1>
          <p style="color: #4a5568; font-size: 16px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px;">${isFarmer ? 'You have received a new order for your products.' : 'Your order has been successfully placed.'}</p>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #718096; font-size: 14px;">Order ID: <strong>${orderId}</strong></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
            <p style="margin: 0; color: #2d3748; font-size: 16px;"><strong>${details.productName}</strong></p>
            <p style="margin: 5px 0 0; color: #4a5568; font-size: 14px;">Quantity: ${details.quantity} ${details.unit}</p>
            <p style="margin: 5px 0 0; color: #4a5568; font-size: 14px;">Total Price: ${details.currency}${details.totalPrice}</p>
          </div>
          <p style="color: #4a5568; font-size: 14px; margin-top: 30px;">
            ${isFarmer ? 'Please log in to your dashboard to manage this order.' : 'The farmer will be notified and will process your order soon.'}
          </p>
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">AgriLink Global Support</p>
        </div>
      </div>
    `,
  },

  messageNotification: {
    subject: "New Message on AgriLink",
    html: (userName: string, senderName: string, messagePreview: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2d3748; font-size: 24px; margin-bottom: 20px;">💬 New Message</h1>
          <p style="color: #4a5568; font-size: 16px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px;">You have received a new message from <strong>${senderName}</strong>:</p>
          <div style="background-color: #f7fafc; padding: 20px; border-left: 4px solid #22c55e; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #4a5568; font-style: italic;">"${messagePreview}"</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://agrilink.global/messages" style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Messages
            </a>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">AgriLink Social Team</p>
        </div>
      </div>
    `,
  }
};
