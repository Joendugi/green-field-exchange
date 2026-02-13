import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, UserPlus, UserMinus, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

const SocialFeedEnhanced = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  // Convex Queries
  const allPosts = useQuery(api.posts.getPosts, { limit: 50 });

  // Mutations
  const createPostMutation = useMutation(api.posts.createPost);
  const likePost = useMutation(api.posts.likePost);
  const unlikePost = useMutation(api.posts.unlikePost);
  const repostPost = useMutation(api.posts.repostPost);
  const unrepostPost = useMutation(api.posts.unrepostPost);
  const addCommentMutation = useMutation(api.posts.addComment);
  const followMutation = useMutation(api.follows.follow);
  const unfollowMutation = useMutation(api.follows.unfollow);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const filteredPosts = allPosts?.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.content?.toLowerCase().includes(query) ||
      post.profiles?.full_name?.toLowerCase().includes(query) ||
      post.profiles?.username?.toLowerCase().includes(query)
    );
  }) || [];

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !mediaFile) return;

    try {
      if (!isAuthenticated) {
        toast.error("Please login to post");
        return;
      }

      let imageUrl = undefined;
      let videoUrl = undefined;

      if (mediaFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": mediaFile.type },
          body: mediaFile,
        });
        const { storageId } = await result.json();

        // In a real app we'd get the URL from the storageId
        // For now we'll assume the backend provides it or we use storageId
        imageUrl = storageId; // Using storageId as placeholder for simplicity
      }

      await createPostMutation({
        content: newPostContent,
        image_url: imageUrl,
        video_url: videoUrl,
      });

      toast.success("Post created!");
      setNewPostContent("");
      setMediaFile(null);
      setMediaPreview("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFollowToggle = async (targetUserId: Id<"users">, isCurrentlyFollowing: boolean) => {
    try {
      if (!isAuthenticated) {
        toast.error("Please login to follow");
        return;
      }

      if (isCurrentlyFollowing) {
        await unfollowMutation({ followingId: targetUserId });
        setFollowingUsers(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
        toast.success("Unfollowed!");
      } else {
        await followMutation({ followingId: targetUserId });
        setFollowingUsers(prev => new Set(prev).add(targetUserId));
        toast.success("Following!");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLikeToggle = async (postId: Id<"posts">, isLiked: boolean) => {
    try {
      if (!isAuthenticated) return;
      if (isLiked) {
        await unlikePost({ postId });
      } else {
        await likePost({ postId });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRepostToggle = async (postId: Id<"posts">, isReposted: boolean) => {
    try {
      if (!isAuthenticated) return;
      if (isReposted) {
        await unrepostPost({ postId });
        toast.success("Repost removed!");
      } else {
        await repostPost({ postId });
        toast.success("Reposted!");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddComment = async (postId: Id<"posts">) => {
    const content = commentInputs[postId as string];
    if (!content?.trim()) return;

    try {
      if (!isAuthenticated) return;
      await addCommentMutation({ postId, content });
      setCommentInputs({ ...commentInputs, [postId as string]: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (allPosts === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {!isAuthenticated ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Join the Community</CardTitle>
            <CardDescription>Sign in to share your farming journey, like posts, and connect with others.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.href = "/auth"} className="w-full">Sign In to Post</Button>
          </CardFooter>
        </Card>
      ) : (
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
            <Button onClick={handleCreatePost} className="w-full" disabled={!newPostContent.trim() && !mediaFile}>
              Post
            </Button>
          </CardFooter>
        </Card>
      )}

      {filteredPosts.map((post) => (
        <Card key={post._id} className="card-hover animate-fade-in">
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
                  <div className="flex items-center gap-2">
                    <a
                      href={`/user/${post.userId}`}
                      className="hover:underline font-semibold"
                    >
                      {post.profiles?.full_name}
                    </a>
                    {post.profiles?.verified && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] h-4">
                        Verified
                      </Badge>
                    )}
                  </div>
                  {post.profiles?.username && (
                    <p className="text-sm text-muted-foreground">@{post.profiles.username}</p>
                  )}
                  <CardDescription>
                    {new Date(post.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {isAuthenticated && post.userId !== currentUser?._id && (
                <Button
                  variant={followingUsers.has(post.userId) ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleFollowToggle(post.userId, followingUsers.has(post.userId))}
                >
                  {followingUsers.has(post.userId) ? (
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
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info("Please sign in to like posts");
                    return;
                  }
                  handleLikeToggle(post._id, post.isLiked);
                }}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${post.isLiked ? "fill-red-500 text-red-500" : ""
                    }`}
                />
                {post.likes_count || 0}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => !isAuthenticated && toast.info("Please sign in to comment")}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {post.comments_count || 0}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info("Please sign in to repost");
                    return;
                  }
                  handleRepostToggle(post._id, post.isReposted);
                }}
              >
                <Repeat2
                  className={`mr-2 h-4 w-4 ${post.isReposted ? "text-green-500" : ""
                    }`}
                />
                {post.reposts_count || 0}
              </Button>
            </div>

            {post.post_comments && post.post_comments.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                {post.post_comments.map((comment: any) => (
                  <div key={comment._id} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/30 p-2 rounded-lg">
                      <p className="text-xs font-semibold">{comment.profiles?.full_name}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <div className="flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={commentInputs[post._id as string] || ""}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post._id as string]: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddComment(post._id);
                  }}
                />
                <Button onClick={() => handleAddComment(post._id)} size="sm">
                  Comment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {filteredPosts.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          No posts found matching your search.
        </Card>
      )}
    </div>
  );
};

export default SocialFeedEnhanced;
