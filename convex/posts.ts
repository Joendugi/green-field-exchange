import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const getPosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_created_at");

    if (args.cursor) {
      const cursorPost = await ctx.db.get(args.cursor as Id<"posts">);
      if (!cursorPost) {
        throw new Error("Cursor not found");
      }
      postsQuery = postsQuery.filter((q) =>
        q.lt(q.field("created_at"), cursorPost.created_at)
      );
    }

    const posts = await postsQuery.order("desc").take(args.limit || 20);

    // Generate image URLs and enhance with status
    return await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", post.userId))
          .unique();

        const userId = await getAuthUserId(ctx);
        let isLiked = false;
        let isReposted = false;

        if (userId) {
          const like = await ctx.db
            .query("post_likes")
            .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", post._id))
            .unique();
          isLiked = !!like;

          const repost = await ctx.db
            .query("post_reposts")
            .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", post._id))
            .unique();
          isReposted = !!repost;
        }

        const comments = await ctx.db
          .query("post_comments")
          .withIndex("by_postId", (q) => q.eq("postId", post._id))
          .collect();

        const commentsWithProfiles = await Promise.all(comments.map(async (c) => {
          const cProfile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", c.userId))
            .unique();
          return { ...c, profiles: cProfile };
        }));

        return {
          ...post,
          profiles: profile,
          isLiked,
          isReposted,
          post_comments: commentsWithProfiles,
          post_likes: { length: post.likes_count }, // UI expects .length
          post_reposts: { length: post.reposts_count || 0 }, // If I add reposts_count
        };
      })
    );
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      userId,
      content: args.content,
      image_url: args.image_url,
      video_url: args.video_url,
      created_at: now,
      updated_at: now,
      likes_count: 0,
      comments_count: 0,
    });

    return postId;
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.userId !== userId) {
      throw new Error("Not authorized to delete this post");
    }

    await ctx.db.delete(args.postId);

    return args.postId;
  },
});

export const repostPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if already reposted
    const existingRepost = await ctx.db
      .query("post_reposts")
      .withIndex("by_userId", (q) =>
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    if (existingRepost) {
      throw new Error("Post already reposted");
    }

    const now = Date.now();
    await ctx.db.insert("post_reposts", {
      userId,
      postId: args.postId,
      created_at: now,
    });

    return args.postId;
  },
});

export const unrepostPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const repost = await ctx.db
      .query("post_reposts")
      .withIndex("by_userId", (q) =>
        q.eq("userId", userId).eq("postId", args.postId)
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const repost = await ctx.db
      .query("post_reposts")
      .withIndex("by_userId", (q) =>
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    return !!repost;
  },
});
export const likePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("post_likes")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();

    if (existing) return;

    await ctx.db.insert("post_likes", {
      userId,
      postId: args.postId,
      created_at: Date.now(),
    });

    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        likes_count: (post.likes_count || 0) + 1,
      });
    }
  },
});

export const unlikePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("post_likes")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();

    if (!existing) return;

    await ctx.db.delete(existing._id);

    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        likes_count: Math.max(0, (post.likes_count || 0) - 1),
      });
    }
  },
});

export const addComment = mutation({
  args: { postId: v.id("posts"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.insert("post_comments", {
      userId,
      postId: args.postId,
      content: args.content,
      created_at: Date.now(),
    });

    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        comments_count: (post.comments_count || 0) + 1,
      });
    }
  },
});
