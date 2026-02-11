import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    full_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    verified: v.boolean(),
    verification_requested: v.boolean(),
    onboarded: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),
  
  posts: defineTable({
    userId: v.id("users"),
    content: v.string(),
    image_url: v.optional(v.string()),
    video_url: v.optional(v.string()),
    likes_count: v.number(),
    comments_count: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_created_at", ["created_at"]),
  
  post_reposts: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    created_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_postId", ["postId"]),
  
  user_settings: defineTable({
    userId: v.id("users"),
    email_notifications: v.boolean(),
    push_notifications: v.boolean(),
    theme: v.string(),
    language: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_userId", ["userId"]),
  
  verification_requests: defineTable({
    userId: v.id("users"),
    status: v.string(),
    documents: v.optional(v.array(v.string())),
    admin_notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
  
  user_roles: defineTable({
    userId: v.id("users"),
    role: v.string(),
    granted_by: v.optional(v.id("users")),
    created_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"]),
  
  advertisements: defineTable({
    title: v.string(),
    description: v.string(),
    image_url: v.optional(v.string()),
    target_url: v.string(),
    status: v.string(),
    start_date: v.number(),
    end_date: v.optional(v.number()),
    budget: v.number(),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created_by", ["created_by"]),
  
  login_attempts: defineTable({
    email: v.string(),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    success: v.boolean(),
    created_at: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_created_at", ["created_at"]),
  
  price_history: defineTable({
    category: v.string(),
    location: v.string(),
    price: v.number(),
    recorded_at: v.number(),
  })
    .index("by_category_location", ["category", "location"])
    .index("by_recorded_at", ["recorded_at"]),
});

export default schema;
