import { useEffect, useState } from "react";
import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  Shield,
  CheckCircle,
  Edit3,
  X,
} from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    location: "",
    phone: "",
    bio: "",
  });
  const [followerCount, setFollowerCount] = useState(0);
<<<<<<< HEAD
  const [hasPendingVerification, setHasPendingVerification] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
=======
  const [joinDate, setJoinDate] = useState<string>("");
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      setUserEmail(user.email);
      setJoinDate(user.$createdAt);

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      // Try to get existing profile
      let profileData = null;
      try {
        profileData = await databases.getDocument(dbId, "profiles", user.$id);
      } catch (e: any) {
        // Profile doesn't exist - create one
        if (e.code === 404) {
          profileData = await databases.createDocument(
            dbId,
            "profiles",
            user.$id,
            {
              full_name: user.name || "",
              username: user.email.split("@")[0],
            }
          );
          toast.info("Profile created! Please complete your details.");
        } else {
          throw e;
        }
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          username: profileData.username || "",
          location: profileData.location || "",
          phone: profileData.phone || "",
          bio: profileData.bio || "",
        });
      }

      // Fetch user role
      const rolesResponse = await databases.listDocuments(
        dbId,
        "user_roles",
        [Query.equal("user_id", user.$id)]
      );
      if (rolesResponse.documents.length > 0) {
        setUserRole(rolesResponse.documents[0]);
      }

      // Fetch follower count
      try {
        const followsData = await databases.listDocuments(
          dbId,
          "follows",
          [Query.equal("following_id", user.$id), Query.limit(1)]
        );
        setFollowerCount(followsData.total || 0);
      } catch (e) {
        console.warn("Could not fetch followers:", e);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD

    if (roleData) {
      setUserRole(roleData);
    }

    // Fetch follower count
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", session.user.id);
    
    setFollowerCount(count || 0);

    const { data: verificationRequests } = await supabase
      .from("verification_requests")
      .select("status")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    setHasPendingVerification(
      verificationRequests?.some((request) => request.status === "pending" || request.status === "in_review") ?? false
    );
=======
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
  };

  const fetchNotifications = async () => {
    try {
      const user = await account.get();
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      const { documents } = await databases.listDocuments(
        dbId,
        "notifications",
        [
          Query.equal("user_id", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(10)
        ]
      );
      setNotifications(documents || []);
    } catch (e) {
      console.warn("Could not fetch notifications:", e);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const user = await account.get();
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      await databases.updateDocument(dbId, "profiles", user.$id, formData);

      toast.success("Profile updated!");
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.updateDocument(dbId, "notifications", notificationId, { is_read: true });
      fetchNotifications();
    } catch (error: any) {
      console.warn("Could not mark as read:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "farmer":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleRequestVerification = async () => {
    try {
      setIsSubmittingVerification(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("verification_requests")
        .insert({
          user_id: session.user.id,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("You already have a pending verification request.");
          setHasPendingVerification(true);
          return;
        }
        throw error;
      }

      toast.success("Verification request submitted! We'll notify you once it's reviewed.");
      setHasPendingVerification(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
<<<<<<< HEAD
      {userRole && !userRole.is_verified && (
        <Card className="border-dashed bg-muted/40">
          <CardHeader>
            <CardTitle>Get verified</CardTitle>
            <CardDescription>
              Verified farmers earn a badge on their profile and can publish unlimited listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              {hasPendingVerification
                ? "Your verification request is currently under review. We'll send you an update soon."
                : "Share proof of identity or business registration so buyers can trust your listings."}
            </p>
            <Button
              onClick={handleRequestVerification}
              disabled={hasPendingVerification || isSubmittingVerification}
            >
              {hasPendingVerification ? "Request submitted" : "Apply for verification"}
            </Button>
          </CardContent>
        </Card>
      )}
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
=======
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row gap-6 -mt-16">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {getInitials(formData.full_name || "U")}
              </AvatarFallback>
            </Avatar>
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760

            {/* Info */}
            <div className="flex-1 pt-4 md:pt-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{formData.full_name || "New User"}</h1>
                  {formData.username && (
                    <p className="text-muted-foreground">@{formData.username}</p>
                  )}
                </div>
                <Button
                  variant={isEditing ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {userRole && (
                  <Badge variant="outline" className={getRoleBadgeColor(userRole.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {userRole.role.charAt(0).toUpperCase() + userRole.role.slice(1)}
                  </Badge>
                )}
                {userRole?.is_verified && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className="text-muted-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {followerCount} followers
                </Badge>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {formData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {formData.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {userEmail}
                </span>
                {joinDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(joinDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {formData.bio && !isEditing && (
                <p className="mt-4 text-sm">{formData.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Edit Profile</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </h3>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <Badge variant="destructive">
              {notifications.filter(n => !n.is_read).length} new
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notif, idx) => (
                <div key={notif.$id}>
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${!notif.is_read ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    onClick={() => !notif.is_read && markAsRead(notif.$id)}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${!notif.is_read ? "bg-primary" : "bg-muted"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.$createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {idx < notifications.slice(0, 5).length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
