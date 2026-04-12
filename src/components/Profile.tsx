import { useState } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getMyNotifications, markNotificationRead } from "@/integrations/supabase/notifications";
import { getCounts } from "@/integrations/supabase/follows";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  MapPin,
  Mail,
  Calendar,
  Users,
  X,
  Camera,
  LayoutDashboard,
  Edit3,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { requestMyVerification, updateMyProfile } from "@/integrations/supabase/profiles";
import { uploadFile } from "@/integrations/supabase/storage";

const Profile = () => {
  const { user: profile, role } = useAuth();

  // Queries & Mutations
  const queryClient = useQueryClient();
  
  const { data: notificationsData } = useSupabaseQuery<any>(
    ["notifications"],
    () => getMyNotifications(),
    { enabled: !!profile }
  );
  const notifications: any[] = (notificationsData as any[]) || [];

  const { data: countsData } = useSupabaseQuery<any>(
    ["follows_count", profile?.id],
    () => getCounts(profile?.id as string),
    { enabled: !!profile?.id }
  );
  const followerCount = (countsData as any)?.followers ?? 0;

  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    location: "",
    bio: "",
    website: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with data when loaded and not editing
  if (profile && !isEditing && formData.full_name === "" && !formData.username) {
    setFormData({
      full_name: profile.full_name || "",
      username: profile.username || "",
      location: profile.location || "",
      bio: profile.bio || "",
      website: profile.website || "",
    });
  }

  const handleUpdateProfile = async () => {
    try {
      setIsSubmitting(true);

      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        try {
          const { publicUrl } = await uploadFile("avatars", avatarFile);
          avatarUrl = publicUrl;
        } catch (error: any) {
          toast.error("Failed to upload avatar. Please ensure 'avatars' bucket exists.");
          setIsSubmitting(false);
          return;
        }
      }

      await updateMyProfile({
        ...formData,
        avatar_url: avatarUrl,
      });

      toast.success("Profile updated!");
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
      // Refresh profile in context if needed, but the query should handle it
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      await requestMyVerification();
      toast.success("Verification request submitted!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e) {
      console.error(e);
    }
  }

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

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row gap-6 -mt-16">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {getInitials(profile.full_name || "U")}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 pt-4 md:pt-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile.full_name || "New User"}</h1>
                  {profile.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {role === "admin" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => navigate("/admin")}
                      className="gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  )}
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
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {role && (
                  <Badge variant="outline" className={getRoleBadgeColor(role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                )}
                {profile.verified && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className="text-muted-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {followerCount ?? 0} followers
                </Badge>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {/* Email is typically not in public profile unless verified or setting allowed, but we display if it's the own user. 
                    Convex profile doesn't have email in schema currently (only in auth).
                    We can fetch it via api.users.getMe (if we had it) or just omit for now.
                */}
                {profile.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {profile.bio && !isEditing && (
                <p className="mt-4 text-sm">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Card */}
      {(!profile.verified) && (
        <Card className="border-dashed bg-muted/40">
          <CardHeader>
            <CardTitle>Get verified</CardTitle>
            <CardDescription>
              Verified farmers earn a badge on their profile and can publish unlimited listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              {profile.verification_requested
                ? "Your verification request is currently under review. We'll send you an update soon."
                : "Share proof of identity or business registration so buyers can trust your listings."}
            </p>
            <Button
              onClick={handleRequestVerification}
              disabled={profile.verification_requested}
            >
              {profile.verification_requested ? "Request submitted" : "Apply for verification"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/forgot-password")}
              className="text-muted-foreground"
            >
              <Mail className="w-4 h-4 mr-2" />
              Forgot Password?
            </Button>
          </CardContent>
        </Card>
      )}

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
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4 mt-2">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || profile?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(formData.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Image must be less than 5MB");
                          return;
                        }
                        setAvatarFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAvatarPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  {avatarFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview("");
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
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
            <Button onClick={handleUpdateProfile} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
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
                <div key={notif.id}>
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${!notif.is_read ? "bg-primary/5 cursor-pointer" : "hover:bg-muted/50"
                      }`}
                    onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.is_read ? "bg-primary" : "bg-muted"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleString()}
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
