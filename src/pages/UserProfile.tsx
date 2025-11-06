import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchCurrentUser();
  }, [userId]);

  const fetchCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      checkIfFollowing(session.user.id);
    }
  };

  const checkIfFollowing = async (currentId: string) => {
    if (!userId) return;
    const { data } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", currentId)
      .eq("following_id", userId)
      .single();
    
    setIsFollowing(!!data);
  };

  const fetchProfile = async () => {
    if (!userId) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    if (roleData) {
      setUserRole(roleData);
    }

    // Fetch follower count
    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);
    
    setFollowerCount(followersCount || 0);

    // Fetch following count
    const { count: followingCountData } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);
    
    setFollowingCount(followingCountData || 0);

    // Fetch followers with usernames
    const { data: followersData } = await supabase
      .from("follows")
      .select(`
        follower_id,
        profiles:follower_id (id, full_name, username)
      `)
      .eq("following_id", userId);

    setFollowers(followersData || []);

    // Fetch user posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        post_likes (user_id),
        post_comments (id)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
  };

  const handleFollow = async () => {
    try {
      if (!currentUserId) {
        toast.error("Please login to follow users");
        return;
      }

      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);
        
        setIsFollowing(false);
        toast.success("Unfollowed!");
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: userId });
        
        setIsFollowing(true);
        toast.success("Following!");
      }

      fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <p>Loading...</p>
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
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle>{profile.full_name}</CardTitle>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}
                {profile.location && (
                  <p className="text-sm text-muted-foreground">{profile.location}</p>
                )}
                <div className="flex gap-4 mt-2">
                  <p className="text-sm">
                    <span className="font-bold">{followerCount}</span> followers
                  </p>
                  <p className="text-sm">
                    <span className="font-bold">{followingCount}</span> following
                  </p>
                </div>
                {userRole && (
                  <Badge className="mt-2">
                    {userRole.role} {userRole.is_verified && "(Verified)"}
                  </Badge>
                )}
              </div>
              {currentUserId && currentUserId !== userId && (
                <Button onClick={handleFollow}>
                  {isFollowing ? (
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
          <CardContent>
            {profile.bio && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {followers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Followers</h3>
                <div className="flex flex-wrap gap-2">
                  {followers.map((follower) => (
                    <Badge
                      key={follower.follower_id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => navigate(`/profile/${follower.profiles.id}`)}
                    >
                      {follower.profiles.username 
                        ? `@${follower.profiles.username}` 
                        : follower.profiles.full_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-4">Posts ({posts.length})</h3>
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-4">
                      <p className="whitespace-pre-wrap mb-2">{post.content}</p>
                      {post.image_url && (
                        <img 
                          src={post.image_url} 
                          alt="Post" 
                          className="w-full rounded-lg max-h-64 object-cover mb-2" 
                        />
                      )}
                      {post.video_url && (
                        <video 
                          src={post.video_url} 
                          controls 
                          className="w-full rounded-lg max-h-64 mb-2" 
                        />
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{post.post_likes?.length || 0} likes</span>
                        <span>{post.post_comments?.length || 0} comments</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {posts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No posts yet</p>
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
