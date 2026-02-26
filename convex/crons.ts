import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Schedule a daily check for expiring products
crons.daily(
    "check-product-expiry",
    { hourUTC: 0, minuteUTC: 0 },
    internal.expiry.checkExpiringProducts,
    {}
);

// Hourly cleanup of expired password reset tokens
crons.hourly(
    "cleanup-password-tokens",
    { minuteUTC: 30 },
    internal.passwordReset.cleanupExpiredTokens,
    {}
);

// Daily order reminders
crons.daily(
    "order-reminders",
    { hourUTC: 8, minuteUTC: 0 },
    internal.orders.sendOrderReminders,
    {}
);

// Daily admin report
crons.daily(
    "daily-admin-report",
    { hourUTC: 7, minuteUTC: 0 },
    internal.admin.generateDailyReport,
    {}
);

export default crons;
