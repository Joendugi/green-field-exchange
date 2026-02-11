import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
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
    const user = await account.get().catch(() => null);
    if (user) {
      setCurrentUserId(user.$id);
      checkIfFollowing(user.$id);
    }
  };

  const checkIfFollowing = async (currentId: string) => {
    if (!userId) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents } = await databases.listDocuments(
      dbId,
      "follows",
      [
        Query.equal("follower_id", currentId),
        Query.equal("following_id", userId),
        Query.limit(1)
      ]
    );

    setIsFollowing(documents.length > 0);
  };

  const fetchProfile = async () => {
    if (!userId) return;

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

    try {
      const profileData = await databases.getDocument(dbId, "profiles", userId);
      if (profileData) {
        setProfile(profileData);
      }

      const { documents: roles } = await databases.listDocuments(
        dbId,
        "user_roles",
        [Query.equal("user_id", userId), Query.limit(1)]
      );
      if (roles.length > 0) {
        setUserRole(roles[0]);
      }
    } catch (error) {
      console.error("Error fetching profile", error);
    }

    // Fetch follower count
    const followersData = await databases.listDocuments(
      dbId,
      "follows",
      [Query.equal("following_id", userId), Query.limit(1)] // limit 1 sufficient for total count
    );
    setFollowerCount(followersData.total || 0);

    // Fetch following count
    const followingData = await databases.listDocuments(
      dbId,
      "follows",
      [Query.equal("follower_id", userId), Query.limit(1)]
    );
    setFollowingCount(followingData.total || 0);

    // Fetch followers with usernames
    // 1. Get follows
    const { documents: followsDocs } = await databases.listDocuments(
      dbId,
      "follows",
      [Query.equal("following_id", userId)]
    );

    // 2. Get profiles for followers
    const followerIds = followsDocs.map(f => f.follower_id);
    if (followerIds.length > 0) {
      const { documents: followerProfiles } = await databases.listDocuments(
        dbId,
        "profiles",
        [Query.equal("$id", followerIds)]
      );

      const profilesMap = followerProfiles.reduce((acc: any, p: any) => ({ ...acc, [p.$id]: p }), {});

      // Map back to expected structure
      const formattedFollowers = followsDocs.map(f => ({
        follower_id: f.follower_id,
        profiles: profilesMap[f.follower_id] || { username: "Unknown", full_name: "Unknown" }
      }));
      setFollowers(formattedFollowers);
    } else {
      setFollowers([]);
    }

    // Fetch user posts
    // Note: Deep joins for likes/comments not efficient here without cloud functions or many requests.
    // We will just fetch posts for now and stub likes/comments counts or fetch if needed (skipping for performance).
    const { documents: postsDocs } = await databases.listDocuments(
      dbId,
      "posts",
      [
        Query.equal("user_id", userId),
        Query.orderDesc("$createdAt")
      ]
    );

    // Stubbing relations for now to avoid errors in UI
    const formattedPosts = postsDocs.map(p => ({
      ...p,
      post_likes: [], // TODO: specialized fetch if needed
      post_comments: []
    }));

    setPosts(formattedPosts);
  };

  const handleFollow = async () => {
    try {
      if (!currentUserId) {
        toast.error("Please login to follow users");
        return;
      }

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      if (isFollowing) {
        // Find document to delete
        const { documents } = await databases.listDocuments(
          dbId,
          "follows",
          [
            Query.equal("follower_id", currentUserId),
            Query.equal("following_id", userId || "")
          ]
        );

        if (documents.length > 0) {
          await databases.deleteDocument(dbId, "follows", documents[0].$id);
        }

        setIsFollowing(false);
        toast.success("Unfollowed!");
      } else {
        await databases.createDocument(
          dbId,
          "follows",
          ID.unique(),
          { follower_id: currentUserId, following_id: userId }
        );

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
                      onClick={() => navigate(`/profile/${follower.profiles.$id}`)}
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
                  <Card key={post.$id}>
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
