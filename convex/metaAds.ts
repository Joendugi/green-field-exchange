import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Meta Pixel tracking
export const trackMetaPixel = mutation({
  args: {
    eventName: v.string(),
    eventData: v.optional(v.any()),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store Meta pixel events for analytics
    await ctx.db.insert("meta_pixel_events", {
      eventName: args.eventName,
      eventData: args.eventData || {},
      userId: args.userId,
      sessionId: args.sessionId,
      value: args.value,
      currency: args.currency,
      timestamp: Date.now(),
      userAgent: "",
      ipAddress: "",
    });

    return { success: true, tracked: true };
  },
});

// Meta Conversions API
export const trackMetaConversion = mutation({
  args: {
    conversionType: v.string(),
    conversionData: v.any(),
    userId: v.optional(v.id("users")),
    orderId: v.optional(v.id("orders")),
    productId: v.optional(v.id("products")),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store conversion data
    await ctx.db.insert("meta_conversions", {
      conversionType: args.conversionType,
      conversionData: args.conversionData,
      userId: args.userId,
      orderId: args.orderId,
      productId: args.productId,
      value: args.value,
      currency: args.currency,
      timestamp: Date.now(),
      userAgent: "",
      ipAddress: "",
    });

    // Log conversion for analytics
    await ctx.db.insert("admin_audit_logs", {
      adminId: "system",
      action: "meta_conversion_tracked",
      targetId: args.userId?.toString() || "anonymous",
      targetType: "meta_conversion",
      details: `${args.conversionType} conversion tracked with value ${args.value} ${args.currency || ""}`,
      timestamp: Date.now(),
    });

    return { success: true, conversionId: "meta_conv_" + Date.now() };
  },
});

// Meta Custom Audiences
export const createMetaCustomAudience = mutation({
  args: {
    audienceName: v.string(),
    audienceDescription: v.string(),
    audienceType: v.string(),
    criteria: v.any(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    const userRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Admin permissions required");
    }

    // Store custom audience
    const audienceId = await ctx.db.insert("meta_custom_audiences", {
      audienceName: args.audienceName,
      audienceDescription: args.audienceDescription,
      audienceType: args.audienceType,
      criteria: args.criteria,
      createdBy: args.userId,
      createdAt: Date.now(),
      isActive: true,
    });

    await ctx.db.insert("admin_audit_logs", {
      adminId: args.userId,
      action: "create_meta_audience",
      targetId: audienceId,
      targetType: "meta_audience",
      details: `Created Meta audience: ${args.audienceName} (${args.audienceType})`,
      timestamp: Date.now(),
    });

    return { success: true, audienceId };
  },
});

// Get Meta custom audiences
export const getMetaAudiences = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("meta_custom_audiences")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", args.userId))
        .collect();
    }
    return await ctx.db.query("meta_custom_audiences").collect();
  },
});

// Get Meta ad campaigns
export const getMetaAdCampaigns = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let campaigns;

    if (args.status) {
      campaigns = ctx.db
        .query("meta_ad_campaigns")
        .withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      campaigns = ctx.db.query("meta_ad_campaigns");
    }

    if (args.limit) {
      return await campaigns.take(args.limit);
    }

    return await campaigns.collect();
  },
});

// Create Meta ad campaign
export const createMetaAdCampaign = mutation({
  args: {
    campaignName: v.string(),
    campaignObjective: v.string(),
    budget: v.number(),
    currency: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    targetAudience: v.optional(v.id("meta_custom_audiences")),
    creativeAssets: v.array(v.any()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    const userRole = await ctx.db
      .query("user_roles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Admin permissions required");
    }

    // Create campaign
    const campaignId = await ctx.db.insert("meta_ad_campaigns", {
      campaignName: args.campaignName,
      campaignObjective: args.campaignObjective,
      budget: args.budget,
      currency: args.currency,
      startDate: args.startDate,
      endDate: args.endDate,
      targetAudience: args.targetAudience,
      creativeAssets: args.creativeAssets,
      createdBy: args.userId,
      status: "draft",
      createdAt: Date.now(),
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
      },
    });

    await ctx.db.insert("admin_audit_logs", {
      adminId: args.userId,
      action: "create_meta_campaign",
      targetId: campaignId,
      targetType: "meta_campaign",
      details: `Created Meta campaign: ${args.campaignName} with budget ${args.budget} ${args.currency}`,
      timestamp: Date.now(),
    });

    return { success: true, campaignId };
  },
});

// Update campaign metrics
export const updateMetaCampaignMetrics = mutation({
  args: {
    campaignId: v.id("meta_ad_campaigns"),
    metrics: v.object({
      impressions: v.number(),
      clicks: v.number(),
      conversions: v.number(),
      spend: v.number(),
      ctr: v.number(),
      cpc: v.number(),
      cpm: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Update campaign metrics
    await ctx.db.patch(args.campaignId, {
      metrics: args.metrics,
      updatedAt: Date.now(),
    });

    return { success: true, updated: true };
  },
});

// Get Meta analytics dashboard data
export const getMetaAnalytics = query({
  args: {
    userId: v.optional(v.id("users")),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
    metrics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const defaultDateRange = {
      start: Date.now() - (30 * 24 * 60 * 60 * 1000),
      end: Date.now(),
    };

    const dateRangeToUse = args.dateRange || defaultDateRange;

    // Get all pixel events
    const allPixelEvents = await ctx.db
      .query("meta_pixel_events")
      .collect();

    // Filter by date range
    const pixelEvents = allPixelEvents.filter(event =>
      event.timestamp >= dateRangeToUse.start && event.timestamp <= dateRangeToUse.end
    );

    // Get all conversions
    const allConversions = await ctx.db
      .query("meta_conversions")
      .collect();

    // Filter by date range
    const conversions = allConversions.filter(conv =>
      conv.timestamp >= dateRangeToUse.start && conv.timestamp <= dateRangeToUse.end
    );

    // Get all campaigns
    const allCampaigns = await ctx.db
      .query("meta_ad_campaigns")
      .collect();

    // Filter by date range
    const campaigns = allCampaigns.filter(camp =>
      camp.createdAt >= dateRangeToUse.start && camp.createdAt <= dateRangeToUse.end
    );

    // Calculate analytics
    const analytics = {
      dateRange: dateRangeToUse,
      pixelEvents: pixelEvents.length,
      conversions: conversions.length,
      campaigns: campaigns.length,
      totalImpressions: campaigns.reduce((sum, camp) => sum + (camp.metrics?.impressions || 0), 0),
      totalClicks: campaigns.reduce((sum, camp) => sum + (camp.metrics?.clicks || 0), 0),
      totalSpend: campaigns.reduce((sum, camp) => sum + (camp.metrics?.spend || 0), 0),
      totalConversions: campaigns.reduce((sum, camp) => sum + (camp.metrics?.conversions || 0), 0),
      averageCTR: campaigns.length > 0 ? campaigns.reduce((sum, camp) => sum + (camp.metrics?.ctr || 0), 0) / campaigns.length : 0,
      averageCPC: campaigns.length > 0 ? campaigns.reduce((sum, camp) => sum + (camp.metrics?.cpc || 0), 0) / campaigns.length : 0,
    };

    return analytics;
  },
});
