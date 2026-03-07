import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, UserPlus, UserMinus, Image as ImageIcon, Video, Loader2, HelpCircle, BookOpen, Lightbulb, CheckCircle2, Tags } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SocialFeedEnhanced = () => {
  const { user: currentUser, isAuthenticated, role } = useAuth();
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

  // Convex Queries
  const allPosts = useQuery(api.posts.getPosts, { 
    limit: 50,
    type: activeTab === "all" ? undefined : activeTab 
  });

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
  const toggleFeatured = useMutation(api.posts.togglePostFeatured);
  const toggleSolution = useMutation(api.posts.toggleCommentSolution);

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
        type: postType,
        tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
      });

      toast.success("Post created!");
      setNewPostContent("");
      setPostType("social");
      setTags("");
      setMediaFile(null);
      setMediaPreview("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleSolution = async (commentId: Id<"post_comments">, isSolution: boolean) => {
    try {
      await toggleSolution({ commentId, isSolution });
      toast.success(isSolution ? "Solution marked!" : "Solution removed");
    } catch (e: any) {
      toast.error(e.message);
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

  const handleToggleFeatured = async (postId: Id<"posts">, isFeatured: boolean) => {
    try {
      await toggleFeatured({ postId, isFeatured: !isFeatured });
      toast.success(isFeatured ? "Removed from Farmer Stories" : "Added to Farmer Stories!");
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
    <div className="max-w-4xl mx-auto space-y-8">
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full grid-cols-4 md:auto p-1 bg-muted/50 rounded-xl border border-primary/10">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">All</TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Stories</TabsTrigger>
            <TabsTrigger value="question" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Q&A</TabsTrigger>
            <TabsTrigger value="guide" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Guides</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full md:w-64 group">
            <Input
              placeholder="Search community..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card/50 backdrop-blur-sm border-primary/20 rounded-xl pl-9 group-hover:border-primary/40 transition-all h-11"
            />
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Create Post Section */}
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
                    <AvatarImage src={currentUser?.image} />
                    <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">Share your journey</CardTitle>
                    <CardDescription>@{currentUser?.name || "Global Farmer"}</CardDescription>
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
                      placeholder="Tags (dry-season, pests...)" 
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
                  "What's happening in your fields today? ✨"
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
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-xl px-6 font-bold shadow-xl"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview("");
                      }}
                    >
                      Discard Media
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center px-8 py-6 bg-primary/5 border-t border-primary/5">
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 text-primary rounded-xl h-11 px-4 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Media
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                />
              </div>
              <Button onClick={handleCreatePost} className="rounded-xl px-10 py-6 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                Publish Content
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="space-y-8 mt-12">
          {(!allPosts || allPosts.length === 0) ? (
            <div className="text-center py-20 bg-card/20 rounded-3xl border border-dashed border-primary/20">
              <h3 className="text-2xl font-bold text-muted-foreground">The fields are quiet...</h3>
              <p className="text-muted-foreground mt-2">Start a conversation to see it here!</p>
            </div>
          ) : (
            allPosts.map((post: any) => (
              <Card key={post._id} className="border-primary/5 hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-2xl group overflow-hidden bg-card/40 backdrop-blur-md rounded-3xl border-l-4 border-l-transparent hover:border-l-primary/40">
                <CardHeader className="pb-3 px-8 pt-8 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/5 group-hover:ring-primary/40 transition-all ring-offset-4 ring-offset-background shadow-md">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback>{post.profiles?.username?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg font-bold hover:text-primary transition-colors cursor-pointer decoration-2 decoration-primary/30">
                            {post.profiles?.full_name || post.profiles?.username}
                          </CardTitle>
                          {post.profiles?.verified && (
                            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-600/20 px-2 py-0.5 h-5 text-[10px] border-blue-200">Verified</Badge>
                          )}
                          
                          {/* Post Type Badge */}
                          {post.type && post.type !== "social" && (
                            <Badge variant="outline" className={`
                              text-[11px] h-5 px-3 rounded-full font-bold tracking-tight
                              ${post.type === "question" ? "border-amber-500 text-amber-700 bg-amber-50 shadow-sm shadow-amber-200" : ""}
                              ${post.type === "guide" ? "border-sky-500 text-sky-700 bg-sky-50 shadow-sm shadow-sky-200" : ""}
                              ${post.type === "advice" ? "border-emerald-500 text-emerald-700 bg-emerald-50 shadow-sm shadow-emerald-200" : ""}
                            `}>
                              {post.type === "question" && <HelpCircle className="h-3 w-3 mr-1.5" />}
                              {post.type === "guide" && <BookOpen className="h-3 w-3 mr-1.5" />}
                              {post.type === "advice" && <Lightbulb className="h-3 w-3 mr-1.5" />}
                              {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm flex items-center gap-2 mt-1 font-medium italic opacity-70">
                          @{post.profiles?.username} • {new Date(post.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    {isAuthenticated && post.userId !== currentUser?._id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 text-primary hover:bg-primary/10 rounded-xl font-bold border border-primary/10 hover:border-primary/30 transition-all shadow-sm"
                        onClick={() => handleFollowToggle(post.userId, followingUsers.has(post.userId))}
                      >
                        {followingUsers.has(post.userId) ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2 text-red-500" /> Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" /> Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Global Feature Badge */}
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
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-primary/5 transition-all duration-700 hover:scale-[1.01] hover:shadow-primary/10">
                      <img
                        src={post.image_url.startsWith("http") ? post.image_url : `https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?q=80&w=2072&auto=format&fit=crop`}
                        alt="Post media"
                        className="w-full object-cover max-h-[600px]"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-6 mt-6 px-8 pb-8">
                  <div className="flex items-center justify-between w-full pt-6 border-t border-primary/5">
                    <div className="flex gap-4 sm:gap-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-11 hover:bg-red-50 hover:text-red-500 transition-all rounded-xl px-5 ${post.isLiked ? "text-red-500 bg-red-50/80 shadow-sm" : "text-muted-foreground/60"}`}
                        onClick={() => handleLikeToggle(post._id, post.isLiked)}
                      >
                        <Heart className={`h-5 w-5 mr-2 ${post.isLiked ? "fill-current scale-125" : "group-hover:scale-110"} transition-all duration-300`} />
                        <span className="font-bold text-base">{post.post_likes?.length || 0}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-11 hover:bg-blue-50 text-muted-foreground/60 hover:text-blue-500 transition-all rounded-xl px-5">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        <span className="font-bold text-base">{post.post_comments?.length || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-11 hover:bg-green-50 hover:text-green-500 transition-all rounded-xl px-5 ${post.isReposted ? "text-green-500 bg-green-50/80 shadow-sm" : "text-muted-foreground/60"}`}
                        onClick={() => handleRepostToggle(post._id, post.isReposted)}
                      >
                        <Repeat2 className="h-5 w-5 mr-2" />
                        <span className="font-bold text-base">{post.post_reposts?.length || 0}</span>
                      </Button>
                    </div>
                    {role === "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-11 ${post.is_featured ? "text-amber-500 bg-amber-50" : "text-muted-foreground/60"} hover:text-amber-600 hover:bg-amber-100 transition-all rounded-xl px-5`}
                        onClick={() => handleToggleFeatured(post._id, !!post.is_featured)}
                      >
                        <Star className={`h-5 w-5 mr-2 ${post.is_featured ? "fill-current" : ""}`} />
                        <span className="font-bold">{post.is_featured ? "Featured" : "Boost"}</span>
                      </Button>
                    )}
                  </div>

                  {/* Enhanced Comments & Q&A Solutions */}
                  <div className="w-full space-y-6 pt-6 border-t border-primary/5">
                    {post.post_comments?.length > 0 && (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {post.post_comments.map((comment: any) => (
                          <div key={comment._id} className={`
                            flex gap-4 p-5 rounded-3xl transition-all border-2 
                            ${comment.is_solution ? "bg-emerald-50/60 border-emerald-200 shadow-md shadow-emerald-100" : "bg-muted/30 border-transparent hover:border-primary/5"}
                          `}>
                            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback>{comment.profiles?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-primary/80">
                                    {comment.profiles?.full_name || comment.profiles?.username}
                                  </span>
                                  {comment.is_solution && (
                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-0.5 h-6 text-[10px] rounded-full shadow-lg shadow-emerald-200">
                                      <CheckCircle2 className="h-3 w-3 mr-1.5" /> BEST SOLUTION
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-black opacity-50 uppercase tracking-widest">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[15px] text-foreground/80 leading-relaxed font-medium">{comment.content}</p>
                              
                              {/* Solution Action for Authors */}
                              {isAuthenticated && currentUser?._id === post.userId && post.type === "question" && (
                                <div className="mt-4 pt-3 border-t border-primary/5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`
                                      h-8 text-[11px] px-4 rounded-xl font-black tracking-widest uppercase transition-all
                                      ${comment.is_solution 
                                        ? "text-red-500 bg-red-50 hover:bg-red-100 shadow-sm" 
                                        : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                      }
                                    `}
                                    onClick={() => handleToggleSolution(comment._id, !comment.is_solution)}
                                  >
                                    {comment.is_solution ? "Remove Solution" : "Accept as Solution"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAuthenticated && (
                      <div className="flex gap-4 items-center group/input mt-4">
                        <Input
                          placeholder={post.type === "question" ? "Share your answer or expertise..." : "Join the conversation..."}
                          value={commentInputs[post._id as string] || ""}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post._id as string]: e.target.value })}
                          className="flex-1 bg-muted/60 border-2 border-transparent h-14 rounded-2xl px-6 text-base focus-visible:ring-primary/40 focus-visible:border-primary/20 transition-all group-hover/input:bg-muted/80 shadow-inner"
                        />
                        <Button
                          size="icon"
                          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-110 active:scale-90"
                          onClick={() => handleAddComment(post._id)}
                        >
                          <BookOpen className="h-6 w-6 rotate-90 transform" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default SocialFeedEnhanced;
