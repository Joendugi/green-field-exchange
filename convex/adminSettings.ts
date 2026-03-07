import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensureAdmin, logAdminAction } from "./helpers";

export const get = query({
    args: {},
    handler: async (ctx) => {
        // Only admins can read admin settings
        await ensureAdmin(ctx);

        // Return the single settings document
        const settings = await ctx.db.query("admin_settings").first();
        return settings;
    }
});


export const update = mutation({
    args: {
        force_dark_mode: v.boolean(),
        enable_beta_features: v.boolean(),
        enable_ads_portal: v.boolean(),
        enable_bulk_tools: v.boolean(),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const existing = await ctx.db.query("admin_settings").first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                updated_by: admin._id,
                updated_at: Date.now()
            });
        } else {
            await ctx.db.insert("admin_settings", {
                ...args,
                updated_by: admin._id,
                updated_at: Date.now()
            });
        }

        await logAdminAction(
            ctx,
            admin._id,
            "update_settings",
            undefined,
            "system",
            `Settings: Beta=${args.enable_beta_features}, Ads=${args.enable_ads_portal}, Bulk=${args.enable_bulk_tools}`
        );
    }
});
