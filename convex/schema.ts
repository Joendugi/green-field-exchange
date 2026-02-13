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
    is_banned: v.optional(v.boolean()),
    ban_reason: v.optional(v.string()),
    onboarding_completed: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),

  admin_settings: defineTable({
    force_dark_mode: v.boolean(),
    enable_beta_features: v.boolean(),
    enable_ads_portal: v.boolean(),
    enable_bulk_tools: v.boolean(),
    updated_by: v.id("users"),
    updated_at: v.number(),
  }),

  posts: defineTable({
    userId: v.id("users"),
    content: v.string(),
    image_url: v.optional(v.string()),
    reposts_count: v.optional(v.number()),
    video_url: v.optional(v.string()),
    likes_count: v.optional(v.number()),
    comments_count: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_created_at", ["created_at"]),


  user_settings: defineTable({
    userId: v.id("users"),
    notifications_enabled: v.boolean(),
    notifications_orders: v.boolean(),
    notifications_social: v.boolean(),
    notifications_system: v.boolean(),
    ai_assistant_enabled: v.boolean(),
    dark_mode: v.boolean(),
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
    last_admin_auth: v.optional(v.number()), // For "Sudo Mode" timeouts
    created_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"]),

  admin_audit_logs: defineTable({
    adminId: v.id("users"),
    action: v.string(),
    targetId: v.optional(v.string()),
    targetType: v.string(), // "user", "product", "post", "settings"
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_adminId", ["adminId"])
    .index("by_timestamp", ["timestamp"]),

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

  products: defineTable({
    farmerId: v.id("users"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    quantity: v.number(),
    unit: v.string(),
    category: v.string(),
    location: v.string(),
    image_url: v.optional(v.string()), // Or v.array(v.string()) if multiple
    image_storage_id: v.optional(v.id("_storage")),
    is_available: v.boolean(),
    is_hidden: v.optional(v.boolean()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_farmerId", ["farmerId"])
    .index("by_category", ["category"])
    .index("by_location", ["location"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "is_available"],
    }),

  orders: defineTable({
    buyerId: v.id("users"),
    farmerId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    total_price: v.number(),
    status: v.string(), // pending, accepted, completed, cancelled
    payment_type: v.string(),
    delivery_address: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_farmerId", ["farmerId"])
    .index("by_status", ["status"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    is_read: v.boolean(),
    created_at: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_senderId", ["senderId"])
    .index("by_is_read", ["is_read"]),

  conversations: defineTable({
    participant1_id: v.id("users"),
    participant2_id: v.id("users"),
    last_message: v.optional(v.string()),
    last_sender_id: v.optional(v.id("users")),
    updated_at: v.number(),
  })
    .index("by_participant1", ["participant1_id"])
    .index("by_participant2", ["participant2_id"])
    .index("by_updated_at", ["updated_at"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    is_read: v.boolean(),
    type: v.optional(v.string()),
    link: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_is_read", ["is_read"]),

  reviews: defineTable({
    reviewerId: v.id("users"),
    revieweeId: v.id("users"), // Could be product or user
    productId: v.optional(v.id("products")),
    rating: v.number(),
    comment: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_revieweeId", ["revieweeId"])
    .index("by_productId", ["productId"]),


  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    created_at: v.number(),
  })
    .index("by_followerId", ["followerId", "followingId"])
    .index("by_followingId", ["followingId"]),

  post_likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    created_at: v.number(),
  })
    .index("by_userId", ["userId", "postId"])
    .index("by_postId", ["postId"]),

  post_comments: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
    created_at: v.number(),
  })
    .index("by_postId", ["postId"]),

  post_reposts: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    created_at: v.number(),
  })
    .index("by_userId", ["userId", "postId"])
    .index("by_postId", ["postId"]),

  rate_limit_tracking: defineTable({
    key: v.string(), // userId or IP address
    action: v.string(), // action being rate limited
    timestamp: v.number(),
  })
    .index("by_key_action", ["key", "action"])
    .index("by_timestamp", ["timestamp"]),
});

export default schema;
