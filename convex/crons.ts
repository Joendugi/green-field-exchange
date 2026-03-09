import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily: expire old products
crons.daily(
    "check-product-expiry",
    { hourUTC: 0, minuteUTC: 0 },
    internal.expiry.checkExpiringProducts,
    {}
);

// Hourly: clean expired password reset tokens
crons.hourly(
    "cleanup-password-tokens",
    { minuteUTC: 30 },
    internal.passwordReset.cleanupExpiredTokens,
    {}
);

// Daily: order reminders to farmers
crons.daily(
    "order-reminders",
    { hourUTC: 8, minuteUTC: 0 },
    internal.orders.sendOrderReminders,
    {}
);

// Daily: platform summary report for admins
crons.daily(
    "daily-admin-report",
    { hourUTC: 7, minuteUTC: 0 },
    internal.admin.generateDailyReport,
    {}
);

// Nightly: purge stale rate-limit tracking rows (older than 24 hours)
crons.daily(
    "cleanup-rate-limits",
    { hourUTC: 2, minuteUTC: 0 },
    internal.rateLimiting.cleanupRateLimitsInternal,
    {}
);

// Nightly: archive old read notifications (older than 30 days)
crons.daily(
    "archive-old-notifications",
    { hourUTC: 3, minuteUTC: 0 },
    internal.notifications.archiveOldNotifications,
    {}
);

export default crons;
