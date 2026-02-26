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

export default crons;
