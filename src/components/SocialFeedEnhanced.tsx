import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    fetchPosts();
    getCurrentUser();
    fetchFollowing();
  }, []);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUserId(session.user.id);
  };

  const fetchFollowing = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", session.user.id);

    setFollowing(new Set(data?.map(f => f.following_id) || []));
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (id, full_name, avatar_url),
        post_likes (user_id),
        post_reposts (user_id),
        post_comments (
          id,
          content,
          created_at,
          profiles:user_id (full_name)
        ),
        original_post:original_post_id (
          id,
          content,
          profiles:user_id (full_name)
        )
      `)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

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

  const uploadMedia = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(folder === "videos" ? "post-images" : "post-images")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("post-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !mediaFile) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let imageUrl = null;
      let videoUrl = null;

      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith("video/");
        const url = await uploadMedia(mediaFile, isVideo ? "videos" : "images");
        if (isVideo) {
          videoUrl = url;
        } else {
          imageUrl = url;
        }
      }

      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: session.user.id,
          content: newPostContent,
          image_url: imageUrl,
          video_url: videoUrl,
        });

      if (error) throw error;

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", session.user.id)
          .eq("following_id", userId);
        
        setFollowing(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: session.user.id, following_id: userId });
        
        setFollowing(prev => new Set(prev).add(userId));
      }

      toast.success(isFollowing ? "Unfollowed!" : "Following!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", session.user.id);
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: session.user.id });
      }

      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRepost = async (postId: string, isReposted: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isReposted) {
        await supabase
          .from("post_reposts")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", session.user.id);
        toast.success("Repost removed!");
      } else {
        await supabase
          .from("post_reposts")
          .insert({ post_id: postId, user_id: session.user.id });
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: session.user.id,
          content,
        });

      if (error) throw error;

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

      {posts.map((post) => (
        <Card key={post.id}>
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
                  <CardTitle className="text-base">{post.profiles?.full_name}</CardTitle>
                  <CardDescription>
                    {new Date(post.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {post.profiles?.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFollow(post.profiles.id, following.has(post.profiles.id))}
                >
                  {following.has(post.profiles.id) ? (
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
                onClick={() => handleLikePost(post.id, isPostLikedByUser(post))}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${
                    isPostLikedByUser(post) ? "fill-red-500 text-red-500" : ""
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
                onClick={() => handleRepost(post.id, isPostRepostedByUser(post))}
              >
                <Repeat2
                  className={`mr-2 h-4 w-4 ${
                    isPostRepostedByUser(post) ? "text-green-500" : ""
                  }`}
                />
                {post.post_reposts?.length || 0}
              </Button>
            </div>

            {post.post_comments && post.post_comments.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                {post.post_comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-2">
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
                value={commentInputs[post.id] || ""}
                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddComment(post.id);
                }}
              />
              <Button onClick={() => handleAddComment(post.id)} size="sm">
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
