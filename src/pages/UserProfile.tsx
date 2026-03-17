import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getUserProfile, getRole } from "@/integrations/supabase/profiles";
import { getCounts, getFollowers, isFollowing, followUser, unfollowUser } from "@/integrations/supabase/follows";
import { getUserPosts } from "@/integrations/supabase/posts";
import { useQueryClient } from "@tanstack/react-query";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId as string;

  // Supabase Queries
  const { data: profileData, isLoading } = useSupabaseQuery<any>(
    ["profile", targetUserId],
    () => getUserProfile(targetUserId)
  );
  const profile: any = profileData;
  
  const { data: userRoleData } = useSupabaseQuery<any>(
    ["role", targetUserId],
    () => getRole(targetUserId)
  );
  const userRole: any = userRoleData;
  
  const { data: countsData } = useSupabaseQuery<any>(
    ["follows_count", targetUserId],
    () => getCounts(targetUserId)
  );
  const counts: any = countsData;
  
  const { data: followersData } = useSupabaseQuery<any>(
    ["followers", targetUserId],
    () => getFollowers(targetUserId)
  );
  const followers: any = followersData;
  
  const { data: followingStatusData } = useSupabaseQuery<any>(
    ["isFollowing", targetUserId],
    () => isFollowing(targetUserId)
  );
  const followingStatus: any = followingStatusData;
  
  const { data: postsData } = useSupabaseQuery<any>(
    ["user_posts", targetUserId],
    () => getUserPosts(targetUserId)
  );
  const posts: any = postsData;

  const handleFollowToggle = async () => {
    try {
      if (!isAuthenticated) {
        toast.error("Please login to follow users");
        return;
      }

      if (followingStatus) {
        await unfollowUser(targetUserId);
        toast.success("Unfollowed!");
      } else {
        await followUser(targetUserId);
        toast.success("Following!");
      }
      queryClient.invalidateQueries({ queryKey: ["isFollowing", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["follows_count", targetUserId] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading || profile === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl">
                  {profile.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <CardTitle className="text-2xl font-bold">{profile.full_name}</CardTitle>
                {profile.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
                <div className="flex justify-center md:justify-start gap-6 mt-4">
                  <div className="text-center">
                    <p className="font-bold text-lg">{counts?.followers ?? 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{counts?.following ?? 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Following</p>
                  </div>
                </div>
                {userRole && (
                  <div className="flex justify-center md:justify-start gap-2 mt-4">
                    <Badge variant="outline" className="px-3 py-1 bg-primary/5">
                      {userRole.role.charAt(0).toUpperCase() + userRole.role.slice(1)}
                    </Badge>
                    {profile.verified && (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                        Verified
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {currentUser?.id !== targetUserId && (
                <Button
                  variant={followingStatus ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  className="w-full md:w-auto"
                >
                  {followingStatus ? (
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
          <CardContent className="space-y-8">
            {profile.bio && (
              <div className="bg-muted/30 p-4 rounded-xl">
                <h3 className="text-sm font-semibold mb-2 uppercase text-muted-foreground tracking-wider">Bio</h3>
                <p className="text-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.location && (
                <div>
                  <h3 className="text-xs font-semibold mb-1 uppercase text-muted-foreground">Location</h3>
                  <p className="text-sm">{profile.location}</p>
                </div>
              )}
              {profile.website && (
                <div>
                  <h3 className="text-xs font-semibold mb-1 uppercase text-muted-foreground">Website</h3>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {profile.website}
                  </a>
                </div>
              )}
            </div>

            {followers && followers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase text-muted-foreground tracking-wider">Recent Followers</h3>
                <div className="flex flex-wrap gap-2">
                  {followers.map((f: any) => (
                    <Badge
                      key={f.follower_id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 py-1.5 px-3"
                      onClick={() => navigate(`/profile/${f.follower_id}`)}
                    >
                      {f.profiles?.username ? `@${f.profiles.username}` : f.profiles?.full_name || "Unknown"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Posts ({posts?.length ?? 0})</h3>
              <div className="grid gap-4">
                {posts?.map((post: any) => (
                  <Card key={post.id} className="border-none shadow-sm bg-muted/20 overflow-hidden hover:bg-muted/30 transition-colors">
                    <CardContent className="p-5">
                      <p className="whitespace-pre-wrap mb-4 text-foreground/90 leading-relaxed">{post.content}</p>
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="Post content"
                          className="w-full rounded-xl max-h-96 object-cover mb-4 shadow-sm"
                          loading="lazy"
                        />
                      )}
                      {post.video_url && (
                        <video
                          src={post.video_url}
                          controls
                          className="w-full rounded-xl max-h-96 mb-4 shadow-sm"
                        />
                      )}
                      <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{post.likes_count || 0}</span> likes
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{post.comments_count || 0}</span> comments
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!posts || posts.length === 0) && (
                  <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                    <p className="text-muted-foreground">No posts to display yet</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
