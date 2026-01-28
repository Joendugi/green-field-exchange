import { useEffect, useState, useRef } from "react";
import { account, databases, storage } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, UserPlus, UserMinus, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SocialFeedEnhanced = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
    getCurrentUser();
    fetchFollowing();
  }, []);

  const getCurrentUser = async () => {
    const user = await account.get().catch(() => null);
    if (user) setCurrentUserId(user.$id);
  };

  const fetchFollowing = async () => {
    const user = await account.get().catch(() => null);
    if (!user) return;

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents } = await databases.listDocuments(
      dbId,
      "follows",
      [Query.equal("follower_id", user.$id)]
    );

    setFollowing(new Set(documents.map(f => f.following_id)));
  };

  const fetchPosts = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

    // 1. Fetch Posts
    const { documents: postsData } = await databases.listDocuments(
      dbId,
      "posts",
      [Query.orderDesc("$createdAt")]
    );

    if (postsData.length === 0) {
      setPosts([]);
      return;
    }

    const postIds = postsData.map(p => p.$id);
    const userIds = new Set(postsData.map(p => p.user_id));

    // 2. Fetch Profiles for Post Authors
    const { documents: profilesData } = await databases.listDocuments(
      dbId,
      "profiles",
      [Query.equal("$id", Array.from(userIds))]
    );
    const profilesMap = profilesData.reduce((acc: any, p: any) => ({ ...acc, [p.$id]: p }), {});

    // 3. Fetch Related Data (cnts/lists) in parallel
    // Note: Fetching ALL comments for ALL posts in feed is heavy. 
    // Optimization: limit to top 3-5, or fetch only on expand. 
    // For now we fetch indiscriminately to match existing logic, but strictly this might hit limits.
    // Appwrite Query.equal array param is limited in size (typ 100).
    // If postIds > 100, we might need chunking. Assuming listDocuments default limit 25 is small enough.

    const [likesRes, repostsRes, commentsRes] = await Promise.all([
      databases.listDocuments(dbId, "post_likes", [Query.equal("post_id", postIds)]),
      databases.listDocuments(dbId, "post_reposts", [Query.equal("post_id", postIds)]),
      databases.listDocuments(dbId, "post_comments", [Query.equal("post_id", postIds), Query.orderAsc("$createdAt")])
    ]);

    // Map relations to posts
    const likesMap = likesRes.documents.reduce((acc: any, like: any) => {
      if (!acc[like.post_id]) acc[like.post_id] = [];
      acc[like.post_id].push(like);
      return acc;
    }, {});

    const repostsMap = repostsRes.documents.reduce((acc: any, repost: any) => {
      if (!acc[repost.post_id]) acc[repost.post_id] = [];
      acc[repost.post_id].push(repost);
      return acc;
    }, {});

    const commentsMap = commentsRes.documents.reduce((acc: any, comment: any) => {
      if (!acc[comment.post_id]) acc[comment.post_id] = [];
      acc[comment.post_id].push(comment);
      return acc;
    }, {});

    // Fetch profiles for comments? (UI shows comment author name)
    const commentUserIds = new Set(commentsRes.documents.map(c => c.user_id));
    if (commentUserIds.size > 0) {
      // Add comment authors to profilesMap if not already there
      const missingUserIds = Array.from(commentUserIds).filter(id => !profilesMap[id as string]);
      if (missingUserIds.length > 0) {
        const { documents: addedProfiles } = await databases.listDocuments(
          dbId,
          "profiles",
          [Query.equal("$id", missingUserIds as string[])]
        );
        addedProfiles.forEach(p => profilesMap[p.$id] = p);
      }
    }

    // 4. Fetch Original Posts for Reposts
    // Not strictly implemented in previous Supabase query either (it assumed a join).
    // The previous code had `original_post:original_post_id (...)`.
    // We need to fetch these if they exist.
    const originalPostIds = new Set(postsData.filter(p => p.original_post_id).map(p => p.original_post_id));
    let originalPostsMap: any = {};
    if (originalPostIds.size > 0) {
      const { documents: origPosts } = await databases.listDocuments(
        dbId,
        "posts",
        [Query.equal("$id", Array.from(originalPostIds) as string[])]
      );

      // We also need profiles for original posts authors
      const origUserIds = new Set(origPosts.map(p => p.user_id));
      const missingOrigUserIds = Array.from(origUserIds).filter(id => !profilesMap[id as string]);
      if (missingOrigUserIds.length > 0) {
        const { documents: addedProfiles } = await databases.listDocuments(
          dbId,
          "profiles",
          [Query.equal("$id", missingOrigUserIds as string[])]
        );
        addedProfiles.forEach(p => profilesMap[p.$id] = p);
      }

      originalPostsMap = origPosts.reduce((acc: any, p: any) => {
        return {
          ...acc,
          [p.$id]: {
            ...p,
            profiles: profilesMap[p.user_id]
          }
        };
      }, {});
    }

    // 5. Assemble final structure
    const joinedPosts = postsData.map(post => {
      // map comments with profiles
      const postComments = (commentsMap[post.$id] || []).map((c: any) => ({
        ...c,
        profiles: profilesMap[c.user_id]
      }));

      return {
        ...post,
        profiles: profilesMap[post.user_id],
        post_likes: likesMap[post.$id] || [],
        post_reposts: repostsMap[post.$id] || [],
        post_comments: postComments,
        original_post: post.original_post_id ? originalPostsMap[post.original_post_id] : null
      };
    });

    setPosts(joinedPosts);
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.content?.toLowerCase().includes(query) ||
      post.profiles?.full_name?.toLowerCase().includes(query) ||
      post.profiles?.username?.toLowerCase().includes(query)
    );
  });

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadMedia = async (file: File) => {
    // Using dynamic bucket ID from env.
    const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;

    try {
      const fileUpload = await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );

      // Get View URL
      const result = storage.getFileView(bucketId, fileUpload.$id);
      return result.href;
    } catch (error) {
      console.error("Upload error", error);
      throw error;
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !mediaFile) return;

    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      let imageUrl = null;
      let videoUrl = null;

      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith("video/");
        // Appwrite Storage doesn't enforce folders like Supabase. 
        // We just use the bucket.
        const url = await uploadMedia(mediaFile);
        if (isVideo) {
          videoUrl = url;
        } else {
          imageUrl = url;
        }
      }

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.createDocument(
        dbId,
        "posts",
        ID.unique(),
        {
          user_id: user.$id,
          content: newPostContent,
          image_url: imageUrl,
          video_url: videoUrl,
        }
      );

      toast.success("Post created!");
      setNewPostContent("");
      setMediaFile(null);
      setMediaPreview("");
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      if (isFollowing) {
        // Find doc to delete
        const { documents } = await databases.listDocuments(
          dbId,
          "follows",
          [
            Query.equal("follower_id", user.$id),
            Query.equal("following_id", userId)
          ]
        );
        if (documents.length > 0) {
          await databases.deleteDocument(dbId, "follows", documents[0].$id);
        }

        setFollowing(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await databases.createDocument(
          dbId,
          "follows",
          ID.unique(),
          { follower_id: user.$id, following_id: userId }
        );

        setFollowing(prev => new Set(prev).add(userId));
      }

      toast.success(isFollowing ? "Unfollowed!" : "Following!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      if (isLiked) {
        const { documents } = await databases.listDocuments(
          dbId,
          "post_likes",
          [
            Query.equal("post_id", postId),
            Query.equal("user_id", user.$id)
          ]
        );
        if (documents.length > 0) {
          await databases.deleteDocument(dbId, "post_likes", documents[0].$id);
        }
      } else {
        await databases.createDocument(
          dbId,
          "post_likes",
          ID.unique(),
          { post_id: postId, user_id: user.$id }
        );
      }

      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRepost = async (postId: string, isReposted: boolean) => {
    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      if (isReposted) {
        const { documents } = await databases.listDocuments(
          dbId,
          "post_reposts",
          [
            Query.equal("post_id", postId),
            Query.equal("user_id", user.$id)
          ]
        );
        if (documents.length > 0) {
          await databases.deleteDocument(dbId, "post_reposts", documents[0].$id);
        }
        toast.success("Repost removed!");
      } else {
        await databases.createDocument(
          dbId,
          "post_reposts",
          ID.unique(),
          { post_id: postId, user_id: user.$id }
        );
        toast.success("Reposted!");
      }

      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.createDocument(
        dbId,
        "post_comments",
        ID.unique(),
        {
          post_id: postId,
          user_id: user.$id,
          content,
          created_at: new Date().toISOString()
        }
      );

      setCommentInputs({ ...commentInputs, [postId]: "" });
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const isPostLikedByUser = (post: any) => {
    return post.post_likes?.some((like: any) => like.user_id === currentUserId);
  };

  const isPostRepostedByUser = (post: any) => {
    return post.post_reposts?.some((repost: any) => repost.user_id === currentUserId);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search posts or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create a Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={3}
          />

          {mediaPreview && (
            <div className="relative">
              {mediaFile?.type.startsWith("video/") ? (
                <video src={mediaPreview} controls className="w-full rounded-lg max-h-64" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
              )}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview("");
                }}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Video className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreatePost} className="w-full">
            Post
          </Button>
        </CardFooter>
      </Card>

      {filteredPosts.map((post) => (
        <Card key={post.$id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback>
                    {post.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <a
                    href={`/profile/${post.profiles?.$id}`}
                    className="hover:underline"
                  >
                    <CardTitle className="text-base">{post.profiles?.full_name}</CardTitle>
                    {post.profiles?.username && (
                      <p className="text-sm text-muted-foreground">@{post.profiles.username}</p>
                    )}
                  </a>
                  <CardDescription>
                    {new Date(post.$createdAt || post.$updatedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {post.profiles?.$id && post.profiles?.$id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFollow(post.profiles!.$id, following.has(post.profiles!.$id))}
                >
                  {following.has(post.profiles!.$id) ? (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {post.is_repost && post.original_post && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Repeat2 className="h-4 w-4" />
                Reposted from {post.original_post.profiles?.full_name}
              </div>
            )}

            <p className="whitespace-pre-wrap">{post.content}</p>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                className="w-full rounded-lg max-h-96 object-cover"
              />
            )}

            {post.video_url && (
              <video
                src={post.video_url}
                controls
                className="w-full rounded-lg max-h-96"
              />
            )}

            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikePost(post.$id, isPostLikedByUser(post))}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${isPostLikedByUser(post) ? "fill-red-500 text-red-500" : ""
                    }`}
                />
                {post.post_likes?.length || 0}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                {post.post_comments?.length || 0}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRepost(post.$id, isPostRepostedByUser(post))}
              >
                <Repeat2
                  className={`mr-2 h-4 w-4 ${isPostRepostedByUser(post) ? "text-green-500" : ""
                    }`}
                />
                {post.post_reposts?.length || 0}
              </Button>
            </div>

            {post.post_comments && post.post_comments.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                {post.post_comments.map((comment: any) => (
                  <div key={comment.$id} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{comment.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={commentInputs[post.$id] || ""}
                onChange={(e) => setCommentInputs({ ...commentInputs, [post.$id]: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddComment(post.$id);
                }}
              />
              <Button onClick={() => handleAddComment(post.$id)} size="sm">
                Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SocialFeedEnhanced;
