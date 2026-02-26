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
      isFarmer ? `🎉 New Order Received #${orderId.slice(0, 8)}` : `✅ Order Confirmed #${orderId.slice(0, 8)}`,
    html: (userName: string, orderId: string, details: { productName: string, quantity: number, unit: string, currency: string, totalPrice: number }, isFarmer: boolean) => `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f3f4f6;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #ecfdf5; width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 32px;">${isFarmer ? '🛍️' : '✨'}</span>
            </div>
            <h1 style="color: #065f46; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">
              ${isFarmer ? 'New Sales Order!' : 'Order Placed!'}
            </h1>
            <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Order ID: #${orderId.slice(0, 8)}</p>
          </div>

          <div style="color: #374151; font-size: 16px; line-height: 1.6;">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>${isFarmer ? 'Great news! You have received a new order for your high-quality produce. Here are the details:' : 'Your order has been successfully placed with the farmer. We will notify you once it is processed.'}</p>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 24px; border-radius: 12px; margin: 30px 0;">
            <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 700;">Order Summary</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
              <span style="color: #6b7280;">Product</span>
              <span style="color: #111827; font-weight: 600;">${details.productName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
              <span style="color: #6b7280;">Quantity</span>
              <span style="color: #111827; font-weight: 600;">${details.quantity} ${details.unit}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 18px;">
              <span style="color: #111827; font-weight: 700;">Total Paid</span>
              <span style="color: #10b981; font-weight: 800;">${details.currency}${details.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://agrilink.global/dashboard/orders" style="background: linear-gradient(to right, #10b981, #059669); color: white; padding: 14px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
              ${isFarmer ? 'Manage Order' : 'Track Order'}
            </a>
          </div>

          <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">AgriLink Global — Connecting Sustainable Agriculture</p>
            <p style="color: #d1d5db; font-size: 12px; margin-top: 8px;">If you have any questions, reply to this email or contact support@agrilink.global</p>
          </div>
        </div>
      </div>
    `,
  },

  messageNotification: {
    subject: "💬 New Direct Message on AgriLink",
    html: (userName: string, senderName: string, messagePreview: string) => `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f3f4f6;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
          <div style="display: flex; align-items: center; margin-bottom: 30px;">
             <div style="background-color: #eff6ff; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                <span style="font-size: 24px;">💬</span>
             </div>
             <div>
                <h1 style="color: #1e40af; font-size: 22px; font-weight: 800; margin: 0;">New message</h1>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">From ${senderName}</p>
             </div>
          </div>

          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
            <p style="color: #4b5563; font-size: 16px; font-style: italic; margin: 0; line-height: 1.6;">"${messagePreview}"</p>
          </div>

          <p style="color: #374151; font-size: 16px; margin-bottom: 30px;">
            Hi <strong>${userName}</strong>, you've received a new private message. Respond now to stay connected!
          </p>

          <div style="text-align: center;">
            <a href="https://agrilink.global/messages" style="background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">
              Reply to Message
            </a>
          </div>

          <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center; color: #9ca3af; font-size: 12px;">
            You can manage your notification preferences in your dashboard settings.
          </div>
        </div>
      </div>
    `,
  }
};
