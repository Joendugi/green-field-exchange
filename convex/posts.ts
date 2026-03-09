import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { ensureAuthenticated, ensureAdmin, logAdminAction } from "./helpers";

export const getPosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    type: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const PAGE_SIZE = Math.min(args.limit ?? 20, 50); // hard cap at 50 per page
    const userId = await getAuthUserId(ctx); // call ONCE, not inside map

    let postsQuery;
    if (args.type && args.type !== "all") {
      postsQuery = ctx.db
        .query("posts")
        .withIndex("by_type", (q) => q.eq("type", args.type));
    } else {
      postsQuery = ctx.db
        .query("posts")
        .withIndex("by_created_at");
    }

    if (args.cursor) {
      const cursorPost = await ctx.db.get(args.cursor as Id<"posts">);
      if (!cursorPost) throw new Error("Cursor not found");
      postsQuery = postsQuery.filter((q) =>
        q.lt(q.field("created_at"), cursorPost.created_at)
      );
    }

    // If tag filtering is needed, over-fetch slightly so we still get a full page
    const fetchSize = args.tag ? PAGE_SIZE * 5 : PAGE_SIZE;
    let posts = await postsQuery.order("desc").take(fetchSize);

    if (args.tag) {
      posts = posts.filter(p => p.tags?.includes(args.tag!));
    }
    posts = posts.slice(0, PAGE_SIZE);

    // Enrich each post — userId is resolved once above
    return await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", post.userId))
          .unique();

        let isLiked = false;
        let isReposted = false;

        if (userId) {
          const [like, repost] = await Promise.all([
            ctx.db.query("post_likes")
              .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", post._id))
              .unique(),
            ctx.db.query("post_reposts")
              .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", post._id))
              .unique(),
          ]);
          isLiked = !!like;
          isReposted = !!repost;
        }

        // Cap comments at 20 per post — prevents loading huge threads on feed
        const comments = await ctx.db
          .query("post_comments")
          .withIndex("by_postId", (q) => q.eq("postId", post._id))
          .take(20);

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
          post_likes: { length: post.likes_count },
          post_reposts: { length: post.reposts_count || 0 },
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
    type: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await ensureAuthenticated(ctx);

    const content = args.content.trim();
    if (content.length === 0 && !args.image_url && !args.video_url) {
      throw new Error("Post cannot be empty");
    }
    if (content.length > 5000) {
      throw new Error("Post content is too long (max 5000 characters)");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      userId,
      content,
      image_url: args.image_url,
      video_url: args.video_url,
      type: args.type || "social",
      tags: args.tags || [],
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
    const userId = await ensureAuthenticated(ctx);

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
    const userId = await ensureAuthenticated(ctx);

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
    const userId = await ensureAuthenticated(ctx);

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
    const userId = await ensureAuthenticated(ctx);

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
    const userId = await ensureAuthenticated(ctx);

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
    const userId = await ensureAuthenticated(ctx);

    const content = args.content.trim();
    if (content.length === 0) {
      throw new Error("Comment cannot be empty");
    }
    if (content.length > 2000) {
      throw new Error("Comment is too long (max 2000 characters)");
    }

    await ctx.db.insert("post_comments", {
      userId,
      postId: args.postId,
      content,
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

export const getFeaturedStories = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("is_featured"), true))
      .order("desc")
      .take(15);

    return await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", post.userId))
          .unique();

        return {
          ...post,
          profiles: profile,
        };
      })
    );
  },
});

export const togglePostFeatured = mutation({
  args: { postId: v.id("posts"), isFeatured: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await ensureAdmin(ctx);

    await ctx.db.patch(args.postId, {
      is_featured: args.isFeatured,
      updated_at: Date.now(),
    });

    // Log the action using standard helper
    await logAdminAction(
        ctx,
        admin._id,
        args.isFeatured ? "feature_post" : "unfeature_post",
        args.postId,
        "post",
        `Post featured by ${admin.name || "Admin"}`
    );
  },
});

export const bulkTogglePostFeatured = mutation({
  args: { postIds: v.array(v.id("posts")), isFeatured: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await ensureAdmin(ctx);

    for (const postId of args.postIds) {
      await ctx.db.patch(postId, {
        is_featured: args.isFeatured,
        updated_at: Date.now(),
      });
    }

    // Log the bulk action
    await logAdminAction(
      ctx,
      admin._id,
      args.isFeatured ? "bulk_feature_posts" : "bulk_unfeature_posts",
      args.postIds[0], // Log the first ID as a reference
      "post",
      `Bulk ${args.isFeatured ? "featured" : "unfeatured"} ${args.postIds.length} posts by ${admin.name || "Admin"}`
    );
  },
});

export const toggleCommentSolution = mutation({
  args: { commentId: v.id("post_comments"), isSolution: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await ensureAuthenticated(ctx);
    
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const post = await ctx.db.get(comment.postId);
    if (!post) throw new Error("Post not found");

    if (post.userId !== userId) {
      throw new Error("Only the post author can mark a solution");
    }

    if (args.isSolution) {
        // Reset other solutions for this post
        const otherSolutions = await ctx.db
            .query("post_comments")
            .withIndex("by_postId", (q) => q.eq("postId", comment.postId))
            .filter((q) => q.eq(q.field("is_solution"), true))
            .collect();

        for (const sol of otherSolutions) {
            await ctx.db.patch(sol._id, { is_solution: false });
        }
    }

    await ctx.db.patch(args.commentId, { is_solution: args.isSolution });
  },
});
