import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPosts = query({
  args: { 
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_created_at", (q) => q.desc("created_at"));
    
    if (args.cursor) {
      const cursorPost = await ctx.db.get(args.cursor as any);
      if (!cursorPost) {
        throw new Error("Cursor not found");
      }
      postsQuery = postsQuery.filter((q) => 
        q.lt(q.field("created_at"), cursorPost.created_at)
      );
    }
    
    const posts = await postsQuery.take(args.limit || 20);
    
    // Get profiles for each post
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", post.userId))
          .first();
        
        return {
          ...post,
          profile,
        };
      })
    );
    
    return postsWithProfiles;
  },
});

export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      return null;
    }
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", post.userId))
      .first();
    
    return {
      ...post,
      profile,
    };
  },
});

export const getUserPosts = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);
    
    return posts;
  },
});

export const createPost = mutation({
  args: {
    content: v.string(),
    image_url: v.optional(v.string()),
    video_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      userId: user._id,
      content: args.content,
      image_url: args.image_url,
      video_url: args.video_url,
      likes_count: 0,
      comments_count: 0,
      created_at: now,
      updated_at: now,
    });
    
    return postId;
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    
    if (post.userId !== user._id) {
      throw new Error("Not authorized to delete this post");
    }
    
    await ctx.db.delete(args.postId);
    
    return args.postId;
  },
});

export const repostPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if already reposted
    const existingRepost = await ctx.db
      .query("post_reposts")
      .withIndex("by_userId", (q) => 
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();
    
    if (existingRepost) {
      throw new Error("Post already reposted");
    }
    
    const now = Date.now();
    await ctx.db.insert("post_reposts", {
      userId: user._id,
      postId: args.postId,
      created_at: now,
    });
    
    return args.postId;
  },
});

export const unrepostPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const repost = await ctx.db
      .query("post_reposts")
      .withIndex("by_userId", (q) => 
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();
    
    if (!repost) {
      throw new Error("Repost not found");
    }
    
    await ctx.db.delete(repost._id);
    
    return args.postId;
  },
});

export const isReposted = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) {
      return false;
    }
    
    const repost = await ctx.db
      .query("post_reposts")
      .withIndex("by_userId", (q) => 
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();
    
    return !!repost;
  },
});
