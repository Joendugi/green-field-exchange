import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to send email via Resend API
async function sendEmail(ctx: any, args: {
  to: string | string[];
  subject: string;
  html: string;
  type: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const timestamp = Date.now();
  const to = Array.isArray(args.to) ? args.to.join(", ") : args.to;

  if (!RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not set. Falling back to console logging.");
    console.log(`📧 [MOCK EMAIL] To: ${args.to}, Subject: ${args.subject}`);

    // Log mock send
    await ctx.runMutation(api.emailService.logEmail, {
      to,
      subject: args.subject,
      type: args.type,
      status: "sent (mock)",
      timestamp,
    });

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
        from: "AgriLink <noreply@agrilink.global>",
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);

      await ctx.runMutation(api.emailService.logEmail, {
        to,
        subject: args.subject,
        type: args.type,
        status: "failed",
        error: JSON.stringify(error),
        timestamp,
      });

      return { success: false, error };
    }

    const data = await response.json();

    await ctx.runMutation(api.emailService.logEmail, {
      to,
      subject: args.subject,
      type: args.type,
      status: "sent",
      resendId: data.id,
      timestamp,
    });

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("Error sending email via Resend:", error);

    await ctx.runMutation(api.emailService.logEmail, {
      to,
      subject: args.subject,
      type: args.type,
      status: "failed",
      error: error.message || "Unknown error",
      timestamp,
    });

    return { success: false, error };
  }
}

// Internal mutation for logging emails
export const logEmail = mutation({
  args: {
    to: v.string(),
    subject: v.string(),
    type: v.string(),
    status: v.string(),
    resendId: v.optional(v.string()),
    error: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // In a real app, we might want to restrict this, but since actions call it internally:
    await ctx.db.insert("email_logs", args);
  },
});

// Send password reset email with OTP
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    otp: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`📧 Sending password reset (OTP) to: ${args.email}`);

    const html = emailTemplates.passwordReset.html(args.otp, args.userName || "User");
    const result = await sendEmail(ctx, {
      to: args.email,
      subject: emailTemplates.passwordReset.subject,
      html,
      type: "otp"
    });

    return {
      success: result.success,
      message: result.success ? "OTP sent successfully" : "Failed to send OTP",
    };
  },
});

// New simplified action for various templates
export const sendBanNotification = action({
  args: { email: v.string(), userName: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const html = emailTemplates.ban.html(args.userName, args.reason);
    return await sendEmail(ctx, {
      to: args.email,
      subject: emailTemplates.ban.subject,
      html,
      type: "ban"
    });
  }
});

export const sendRoleChangeNotification = action({
  args: { email: v.string(), userName: v.string(), newRole: v.string() },
  handler: async (ctx, args) => {
    const html = emailTemplates.roleChange.html(args.userName, args.newRole);
    return await sendEmail(ctx, {
      to: args.email,
      subject: emailTemplates.roleChange.subject,
      html,
      type: "role_change"
    });
  }
});

export const sendVerificationResult = action({
  args: { email: v.string(), userName: v.string(), approved: v.boolean(), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const html = emailTemplates.verificationResult.html(args.userName, args.approved, args.notes);
    return await sendEmail(ctx, {
      to: args.email,
      subject: args.approved ? "AgriLink - Verification Approved!" : "AgriLink - Verification Update",
      html,
      type: "verification"
    });
  }
});

export const sendBulkEmail = action({
  args: { to: v.array(v.string()), subject: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const html = emailTemplates.broadcast.html(args.subject, args.message);
    // Note: Resend batch API would be better here for large lists, but fetch loop or array is fine for MVP
    return await sendEmail(ctx, {
      to: args.to,
      subject: args.subject,
      html,
      type: "broadcast"
    });
  }
});

export const sendOrderConfirmationEmail = action({
  args: {
    email: v.string(),
    userName: v.string(),
    orderId: v.string(),
    details: v.object({
      productName: v.string(),
      quantity: v.number(),
      unit: v.string(),
      currency: v.string(),
      totalPrice: v.number(),
    }),
    isFarmer: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subjectLine = emailTemplates.orderConfirmation.subject(args.isFarmer, args.orderId);
    const html = emailTemplates.orderConfirmation.html(args.userName, args.orderId, args.details, args.isFarmer);
    return await sendEmail(ctx, {
      to: args.email,
      subject: subjectLine,
      html,
      type: "order"
    });
  }
});

export const sendMessageNotificationEmail = action({
  args: { email: v.string(), userName: v.string(), senderName: v.string(), messagePreview: v.string() },
  handler: async (ctx, args) => {
    const html = emailTemplates.messageNotification.html(args.userName, args.senderName, args.messagePreview);
    return await sendEmail(ctx, {
      to: args.email,
      subject: emailTemplates.messageNotification.subject,
      html,
      type: "message"
    });
  }
});


// Email templates for different purposes
export const emailTemplates = {
  passwordReset: {
    subject: "Reset your AgriLink password",
    html: (otp: string, userName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2d3748; font-size: 24px; margin-bottom: 20px;">🔐 Password Reset Code</h1>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Use the following 6-digit code to reset your AgriLink password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; color: #16a34a; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; border-radius: 8px;">
              ${otp}
            </div>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">This code will expire in 1 hour for security reasons.</p>
          <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `,
  },

  ban: {
    subject: "Account Status Update - AgriLink",
    html: (userName: string, reason?: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">⚠️ Account Suspended</h1>
          <p style="color: #4a5568; font-size: 16px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px;">Your AgriLink account has been suspended by an administrator.</p>
          ${reason ? `<div style="background-color: #fff1f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; color: #991b1b;">Reason: ${reason}</div>` : ''}
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">If you believe this is a mistake, please contact support@agrilink.global</p>
        </div>
      </div>
    `
  },

  roleChange: {
    subject: "Role Updated - AgriLink",
    html: (userName: string, newRole: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #eff6ff;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">🛡️ Role Updated</h1>
          <p style="color: #4a5568; font-size: 16px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px;">Your account role has been updated to: <strong>${newRole}</strong></p>
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">AgriLink Administration Team</p>
        </div>
      </div>
    `
  },

  verificationResult: {
    html: (userName: string, approved: boolean, notes?: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: ${approved ? '#16a34a' : '#2d3748'}; font-size: 24px; margin-bottom: 20px;">
            ${approved ? '✅ Verification Approved!' : '📋 Verification Update'}
          </h1>
          <p style="color: #4a5568; font-size: 16px;">Hello ${userName},</p>
          <p style="color: #4a5568; font-size: 16px;">
            ${approved
        ? 'Congratulations! Your account has been verified. You can now list products and enjoy full platform access.'
        : 'Our team has reviewed your verification request and requires more information or has declined the submission.'}
          </p>
          ${notes ? `<div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;"><strong>Notes from Auditor:</strong><br/>${notes}</div>` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://agrilink.global/profile" style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Go to Profile
            </a>
          </div>
        </div>
      </div>
    `
  },

  broadcast: {
    html: (title: string, message: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fee7;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 20px;">📣 ${title}</h1>
          <div style="color: #4a5568; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">You are receiving this because you are a registered user of AgriLink.</p>
        </div>
      </div>
    `
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
