import { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, UserPlus, UserMinus, Image as ImageIcon, HelpCircle, BookOpen, Lightbulb, CheckCircle2, Tags, Star, Search, Loader2, Send, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getPosts, createPost, toggleLike, addComment, updatePostFeaturedStatus, toggleRepost, toggleCommentSolution } from "@/integrations/supabase/posts";
import { followUser, unfollowUser, getFollowing } from "@/integrations/supabase/follows";
import { uploadFile } from "@/integrations/supabase/storage";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_COLORS: Record<string, string> = {
  question: "border-amber-500 text-amber-700 bg-amber-50 shadow-sm shadow-amber-200",
  guide: "border-sky-500 text-sky-700 bg-sky-50 shadow-sm shadow-sky-200",
  advice: "border-emerald-500 text-emerald-700 bg-emerald-50 shadow-sm shadow-emerald-200",
};

const SocialFeedEnhanced = () => {
  const { user: currentUser, isAuthenticated, role } = useAuth();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState("social");
  const [tags, setTags] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: posts = [], isLoading: isLoadingPosts, error: postsError } = useSupabaseQuery<any[]>(
    ["posts"],
    () => getPosts()
  );

  useEffect(() => {
    if (currentUser) {
      getFollowing().then(ids => setFollowingUsers(new Set(ids))).catch(console.error);
    }
  }, [currentUser]);

  const filteredPosts = useMemo(() => {
    const all = (posts || []) as any[];
    return all.filter(post => {
      if (activeTab !== "all" && post.type !== activeTab) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        post.content?.toLowerCase().includes(q) ||
        post.user_id?.full_name?.toLowerCase().includes(q) ||
        post.user_id?.username?.toLowerCase().includes(q)
      );
    });
  }, [posts, searchQuery, activeTab]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File size must be less than 10MB"); return; }
    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !mediaFile) return;
    if (!isAuthenticated) { toast.error("Please sign in to post"); return; }
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (mediaFile) {
        const { publicUrl } = await uploadFile("post-media", mediaFile);
        imageUrl = publicUrl;
      }
      await createPost({
        content: newPostContent,
        type: postType,
        tags: tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        image_url: imageUrl,
      });
      toast.success("Post published to the community!");
      setNewPostContent("");
      setMediaFile(null);
      setMediaPreview("");
      setTags("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error: any) {
      toast.error("Failed to publish: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!isAuthenticated) { toast.error("Please sign in to follow"); return; }
    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(targetUserId);
        setFollowingUsers(prev => { const n = new Set(prev); n.delete(targetUserId); return n; });
        toast.success("Unfollowed");
      } else {
        await followUser(targetUserId);
        setFollowingUsers(prev => { const n = new Set(prev); n.add(targetUserId); return n; });
        toast.success("Following!");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!isAuthenticated) { toast.error("Sign in to like posts"); return; }
    try {
      await toggleLike(postId);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRepostToggle = async (postId: string, isReposted: boolean) => {
    if (!isAuthenticated) { toast.error("Sign in to repost"); return; }
    try {
      await toggleRepost(postId);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(isReposted ? "Repost removed" : "Shared to your network!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim() || !isAuthenticated) return;
    try {
      await addComment(postId, content);
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleFeatured = async (postId: string, isFeatured: boolean) => {
    try {
      await updatePostFeaturedStatus(postId, !isFeatured);
      toast.success(isFeatured ? "Removed from featured" : "Post featured on home page!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error: any) {
      toast.error("Admin only: " + error.message);
    }
  };

  const handleToggleSolution = async (commentId: string, isSolution: boolean) => {
    try {
      await toggleCommentSolution(commentId, isSolution);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(isSolution ? "Solution removed" : "Marked as best solution!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  const PostCard = ({ post }: { post: any }) => {
    const authorId: string | undefined = post.user_id_raw || post.user_id?.id;
    const isOwnPost = currentUser?.id === authorId;
    const isFollowingAuthor = authorId ? followingUsers.has(authorId) : false;

    return (
      <Card className="border-primary/5 hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-2xl group overflow-hidden bg-card/40 backdrop-blur-md rounded-3xl border-l-4 border-l-transparent hover:border-l-primary/40">
        <CardHeader className="pb-3 px-8 pt-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-primary/5 group-hover:ring-primary/40 transition-all ring-offset-4 ring-offset-background shadow-md">
                <AvatarImage src={post.user_id?.avatar_url} />
                <AvatarFallback>
                  {(post.user_id?.username?.[0] || post.user_id?.full_name?.[0] || "F").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-lg font-bold hover:text-primary transition-colors cursor-pointer">
                    {post.user_id?.full_name || post.user_id?.username || "A Farmer"}
                  </CardTitle>
                  {post.user_id?.verified && (
                    <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-600/20 px-2 py-0.5 h-5 text-[10px] border-blue-200">Verified</Badge>
                  )}
                  {post.type && post.type !== "social" && (
                    <Badge variant="outline" className={`text-[11px] h-5 px-3 rounded-full font-bold tracking-tight ${TYPE_COLORS[post.type] || ""}`}>
                      {post.type === "question" && <HelpCircle className="h-3 w-3 mr-1.5 inline" />}
                      {post.type === "guide" && <BookOpen className="h-3 w-3 mr-1.5 inline" />}
                      {post.type === "advice" && <Lightbulb className="h-3 w-3 mr-1.5 inline" />}
                      {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm flex items-center gap-2 mt-1 font-medium italic opacity-70">
                  @{post.user_id?.username || "farmer"} &bull; {new Date(post.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>

            {isAuthenticated && !isOwnPost && authorId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-primary hover:bg-primary/10 rounded-xl font-bold border border-primary/10 hover:border-primary/30 transition-all shadow-sm"
                onClick={() => handleFollowToggle(authorId, isFollowingAuthor)}
              >
                {isFollowingAuthor
                  ? <><UserMinus className="h-4 w-4 mr-2 text-red-500" />Unfollow</>
                  : <><UserPlus className="h-4 w-4 mr-2" />Follow</>
                }
              </Button>
            )}
          </div>

          {post.is_featured && (
            <div className="absolute top-0 right-0 p-3">
              <div className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-bl-2xl flex items-center gap-2 text-[12px] font-black border-b border-l border-amber-200 shadow-md transform translate-x-3 -translate-y-3 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500">
                <Star className="h-3.5 w-3.5 fill-amber-500" /> COMMUNITY PICK
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-8 py-3 space-y-6">
          <p className="text-lg text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-[13px] font-bold text-primary/80 hover:text-primary transition-all cursor-pointer bg-primary/5 px-3 py-1 rounded-full border border-primary/10 hover:bg-primary/10 hover:scale-105 transform">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {post.image_url && (
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-primary/5 hover:scale-[1.01] transition-transform duration-700">
              <img src={post.image_url} alt="Post media" className="w-full object-cover max-h-[600px]" />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-6 mt-6 px-8 pb-8">
          {/* Action bar */}
          <div className="flex items-center justify-between w-full pt-6 border-t border-primary/5">
            <div className="flex gap-4 sm:gap-10">
              <Button
                variant="ghost" size="sm"
                className={`h-11 hover:bg-red-50 hover:text-red-500 transition-all rounded-xl px-5 ${(post.post_likes?.length || 0) > 0 ? "text-red-500" : "text-muted-foreground/60"}`}
                onClick={() => handleLikeToggle(post.id)}
              >
                <Heart className="h-5 w-5 mr-2 transition-all duration-300" />
                <span className="font-bold text-base">{post.post_likes?.length || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-11 hover:bg-blue-50 text-muted-foreground/60 hover:text-blue-500 transition-all rounded-xl px-5">
                <MessageCircle className="h-5 w-5 mr-2" />
                <span className="font-bold text-base">{post.post_comments?.length || 0}</span>
              </Button>
              <Button
                variant="ghost" size="sm"
                className={`h-11 hover:bg-green-50 hover:text-green-500 transition-all rounded-xl px-5 ${(post.post_reposts?.length || 0) > 0 ? "text-green-500" : "text-muted-foreground/60"}`}
                onClick={() => handleRepostToggle(post.id, (post.post_reposts?.length || 0) > 0)}
              >
                <Repeat2 className="h-5 w-5 mr-2" />
                <span className="font-bold text-base">{post.post_reposts?.length || 0}</span>
              </Button>
            </div>
            {role === "admin" && (
              <Button
                variant="ghost" size="sm"
                className={`h-11 ${post.is_featured ? "text-amber-500 bg-amber-50" : "text-muted-foreground/60"} hover:text-amber-600 hover:bg-amber-100 transition-all rounded-xl px-5`}
                onClick={() => handleToggleFeatured(post.id, !!post.is_featured)}
              >
                <Star className={`h-5 w-5 mr-2 ${post.is_featured ? "fill-current" : ""}`} />
                <span className="font-bold">{post.is_featured ? "Featured" : "Boost"}</span>
              </Button>
            )}
          </div>

          {/* Comments */}
          <div className="w-full space-y-6 pt-6 border-t border-primary/5">
            {post.post_comments?.length > 0 && (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {post.post_comments.map((comment: any) => {
                  // Supabase join returns comment.profiles when using post_comments(*, profiles(*))
                  const cp = comment.profiles || comment.user_id || {};
                  return (
                    <div key={comment.id} className={`flex gap-4 p-5 rounded-3xl transition-all border-2 ${comment.is_solution ? "bg-emerald-50/60 border-emerald-200 shadow-md" : "bg-muted/30 border-transparent hover:border-primary/5"}`}>
                      <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                        <AvatarImage src={cp?.avatar_url} />
                        <AvatarFallback>{(cp?.username?.[0] || "?").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-primary/80">{cp?.full_name || cp?.username || "Farmer"}</span>
                            {comment.is_solution && (
                              <Badge className="bg-emerald-600 text-white px-3 py-0.5 h-6 text-[10px] rounded-full shadow-lg shadow-emerald-200">
                                <CheckCircle2 className="h-3 w-3 mr-1.5" /> BEST SOLUTION
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-black opacity-50 uppercase tracking-widest">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[15px] text-foreground/80 leading-relaxed font-medium">{comment.content}</p>
                        {isAuthenticated && isOwnPost && post.type === "question" && (
                          <div className="mt-4 pt-3 border-t border-primary/5">
                            <Button
                              variant="ghost" size="sm"
                              className={`h-8 text-[11px] px-4 rounded-xl font-black tracking-widest uppercase transition-all ${comment.is_solution ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"}`}
                              onClick={() => handleToggleSolution(comment.id, !comment.is_solution)}
                            >
                              {comment.is_solution ? "Remove Solution" : "Accept as Solution"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isAuthenticated && (
              <div className="flex gap-3 items-center mt-4">
                <Input
                  placeholder={post.type === "question" ? "Share your answer or expertise..." : "Join the conversation..."}
                  value={commentInputs[post.id] || ""}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(post.id); } }}
                  className="flex-1 bg-muted/60 border-2 border-transparent h-14 rounded-2xl px-6 text-base focus-visible:ring-primary/40 focus-visible:border-primary/20 transition-all shadow-inner"
                />
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-110 active:scale-90 shrink-0"
                  onClick={() => handleAddComment(post.id)}
                  disabled={!commentInputs[post.id]?.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  const PostsList = ({ items }: { items: any[] }) => {
    if (isLoadingPosts) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          <p>Loading community posts...</p>
        </div>
      );
    }
    if (postsError) {
      return (
        <div className="text-center py-20 bg-red-50/30 rounded-3xl border border-dashed border-red-200 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h3 className="text-xl font-bold text-red-500">Could not load posts</h3>
          <p className="text-sm text-muted-foreground">{(postsError as any)?.message || "Check your connection and try again."}</p>
          <Button variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ["posts"] })}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      );
    }
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-20 bg-card/20 rounded-3xl border border-dashed border-primary/20">
          <h3 className="text-2xl font-bold text-muted-foreground">The fields are quiet...</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {isAuthenticated ? "Be the first to post in this category!" : "Sign in to see and create posts."}
          </p>
        </div>
      );
    }
    return <div className="space-y-8">{items.map(post => <PostCard key={post.id} post={post} />)}</div>;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        {/* Tabs header + search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full grid-cols-4 md:w-auto p-1 bg-muted/50 rounded-xl border border-primary/10">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">All</TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Stories</TabsTrigger>
            <TabsTrigger value="question" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Q&amp;A</TabsTrigger>
            <TabsTrigger value="guide" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Guides</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-64 group">
            <Input
              placeholder="Search community..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card/50 backdrop-blur-sm border-primary/20 rounded-xl pl-9 group-hover:border-primary/40 transition-all h-11"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Create Post Card */}
        {!isAuthenticated ? (
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-md shadow-xl overflow-hidden rounded-3xl mb-8">
            <CardHeader className="text-center py-10">
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Ready to contribute?</CardTitle>
              <CardDescription className="text-lg">Sign in to share your harvest, ask questions, or help fellow farmers.</CardDescription>
              <div className="pt-6">
                <Button onClick={() => window.location.href = "/auth"} className="rounded-xl px-10 py-6 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.05] transition-transform">
                  Sign In to Join Discussion
                </Button>
              </div>
            </CardHeader>
          </Card>
        ) : (
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-md shadow-xl overflow-hidden rounded-3xl mb-8 group/card hover:border-primary/30 transition-all">
            <CardHeader className="pb-3 px-8 pt-8 border-b border-primary/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background group-hover/card:ring-primary/40 transition-all">
                    <AvatarFallback>{currentUser?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">Share your journey</CardTitle>
                    <CardDescription>@{currentUser?.email?.split("@")[0] || "farmer"}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl border-primary/20 bg-muted/30">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="social">Farmer Story</SelectItem>
                      <SelectItem value="question">Question / Help</SelectItem>
                      <SelectItem value="guide">Technical Guide</SelectItem>
                      <SelectItem value="advice">Advice / Tip</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative group/tags flex-1 sm:w-48">
                    <Tags className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/tags:text-primary transition-colors" />
                    <Input
                      placeholder="Tags (drought, pests...)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="h-10 pl-9 rounded-xl border-primary/20 bg-muted/30 focus-visible:ring-primary/40 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 py-6">
              <Textarea
                placeholder={
                  postType === "question" ? "What farming challenge do you need help with? 🌾" :
                  postType === "guide" ? "Share step-by-step knowledge with others... 📚" :
                  "What is happening in your fields today? ✨"
                }
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[160px] focus-visible:ring-0 border-none shadow-none text-lg resize-none p-0 bg-transparent placeholder:text-muted-foreground/50 transition-all"
                maxLength={5000}
              />
              {mediaPreview && (
                <div className="mt-4 relative rounded-2xl overflow-hidden border border-primary/10 group/media shadow-lg">
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-[400px] object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Button variant="destructive" size="sm" className="rounded-xl px-6 font-bold" onClick={() => { setMediaFile(null); setMediaPreview(""); }}>
                      Discard Media
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center px-8 py-6 bg-primary/5 border-t border-primary/5">
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 text-primary rounded-xl h-11 px-4 transition-all" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-5 w-5 mr-2" /> Media
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleMediaChange} />
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={isSubmitting || (!newPostContent.trim() && !mediaFile)}
                className="rounded-xl px-10 py-6 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isSubmitting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Publishing...</> : "Publish Content"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Posts list per tab */}
        <TabsContent value="all" className="mt-0"><PostsList items={filteredPosts} /></TabsContent>
        <TabsContent value="social" className="mt-0"><PostsList items={filteredPosts} /></TabsContent>
        <TabsContent value="question" className="mt-0"><PostsList items={filteredPosts} /></TabsContent>
        <TabsContent value="guide" className="mt-0"><PostsList items={filteredPosts} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialFeedEnhanced;
