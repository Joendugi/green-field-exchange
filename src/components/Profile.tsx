import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, User, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportUserData } from "@/lib/dataExport";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    location: "",
    phone: "",
    bio: "",
  });
  const [followerCount, setFollowerCount] = useState(0);
  const [hasPendingVerification, setHasPendingVerification] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

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
  };

  const fetchNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", session.user.id)
        .eq("is_read", false);

      if (error) throw error;
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleExportData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      toast.info("Preparing your data export...");
      const result = await exportUserData(supabase, session.user.id);

      if (result.success) {
        toast.success("Data exported successfully! Check your downloads folder.");
      } else {
        toast.error("Failed to export data. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {formData.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{formData.full_name}</CardTitle>
                  <CardDescription>
                    {formData.username && <p className="text-sm">@{formData.username}</p>}
                    <p className="text-sm mt-1">{followerCount} followers</p>
                    {userRole && (
                      <Badge className="mt-2">
                        {userRole.role} {userRole.is_verified && "(Verified)"}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State"
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
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProfile} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button onClick={handleExportData} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Export My Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                {notifications.some(n => !n.is_read) && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      !notification.is_read ? "bg-secondary" : "bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{notification.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">No notifications yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
