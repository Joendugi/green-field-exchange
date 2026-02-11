import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordPrice = mutation({
  args: {
    category: v.string(),
    location: v.string(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("price_history", {
      category: args.category,
      location: args.location,
      price: args.price,
      recorded_at: now,
    });
    
    return true;
  },
});

export const getPriceHistory = query({
  args: {
    category: v.string(),
    location: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("price_history")
      .withIndex("by_category_location", (q) => 
        q.eq("category", args.category).eq("location", args.location)
      )
      .order("desc")
      .take(args.limit || 50);
    
    return history;
  },
});

export const predictPrice = query({
  args: {
    category: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    // Get price history for the category and location
    const history = await ctx.db
      .query("price_history")
      .withIndex("by_category_location", (q) => 
        q.eq("category", args.category).eq("location", args.location)
      )
      .order("desc")
      .take(50);
    
    if (history.length < 3) {
      return {
        prediction: null,
        confidence: 0,
        reasoning: "Insufficient data for prediction",
      };
    }
    
    // Simple linear regression for price prediction
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    history.reverse().forEach((record, index) => {
      const x = index;
      const y = record.price;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next price
    const nextX = n;
    const predictedPrice = slope * nextX + intercept;
    
    // Calculate confidence based on variance
    const mean = sumY / n;
    const variance = history.reduce((acc, record) => {
      return acc + Math.pow(record.price - mean, 2);
    }, 0) / n;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100));
    
    return {
      prediction: Math.round(predictedPrice * 100) / 100,
      confidence: Math.round(confidence),
      reasoning: `Based on ${n} historical data points with ${confidence}% confidence`,
    };
  },
});
