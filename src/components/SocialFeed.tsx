import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const SocialFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchPosts();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUserId(session.user.id);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (full_name, avatar_url),
        post_likes (user_id),
        post_comments (
          id,
          content,
          created_at,
          profiles:user_id (full_name)
        )
      `)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: session.user.id,
          content: newPostContent,
        });

      if (error) throw error;

      toast.success("Post created!");
      setNewPostContent("");
      fetchPosts();
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a Post</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={3}
          />
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
            <div className="flex items-center gap-3">
              <Avatar>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap">{post.content}</p>
            
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

export default SocialFeed;
