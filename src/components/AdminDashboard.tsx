import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
=======
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  XCircle,
  Ban,
  Shield,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Search,
  AlertTriangle,
  Download,
} from "lucide-react";
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  XCircle,
  Megaphone,
  Ban as BanIcon,
  Wrench,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { exportSystemData } from "@/lib/dataExport";

type AdminSettingsState = {
  id?: string;
  force_dark_mode: boolean;
  enable_beta_features: boolean;
  enable_ads_portal: boolean;
  enable_bulk_tools: boolean;
};

const defaultAdminSettings: AdminSettingsState = {
  force_dark_mode: false,
  enable_beta_features: false,
  enable_ads_portal: true,
  enable_bulk_tools: true,
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
<<<<<<< HEAD
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettingsState>(defaultAdminSettings);
  const [settingsSavingKey, setSettingsSavingKey] = useState<string | null>(null);
  const [advertisements, setAdvertisements] = useState<any[]>([]);
  const [newAd, setNewAd] = useState({
    title: "",
    body: "",
    image_url: "",
    cta_label: "",
    cta_link: "",
  });
  const [adSaving, setAdSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [priceDelta, setPriceDelta] = useState("5");
  const [banLoadingId, setBanLoadingId] = useState<string | null>(null);
=======
  const [posts, setPosts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHiddenContent, setShowHiddenContent] = useState(false);

  // Dialogs
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAdminId(session?.user.id || null);
    };

    loadSession();
    fetchStats();
    fetchUsers();
    fetchVerificationRequests();
<<<<<<< HEAD
    fetchAdminSettings();
    fetchAdvertisements();
=======
    fetchPosts();
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
    fetchProducts();
  }, []);

  const fetchStats = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

    const { total: userCount } = await databases.listDocuments(dbId, "profiles", [Query.limit(1)]);
    const { total: productCount } = await databases.listDocuments(dbId, "products", [Query.limit(1)]);
    const { total: orderCount } = await databases.listDocuments(dbId, "orders", [Query.limit(1)]);

    const { documents: orders } = await databases.listDocuments(dbId, "orders", [Query.select(["total_price"]), Query.limit(1000)]);

    const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price?.toString() || "0"), 0);

    setStats({
      users: userCount,
      products: productCount,
      orders: orderCount,
      revenue,
    });
  };

  const fetchUsers = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents: profiles } = await databases.listDocuments(
      dbId,
      "profiles",
      [Query.orderDesc("$createdAt")]
    );

    if (profiles.length === 0) {
      setUsers([]);
      return;
    }

    const userIds = profiles.map(p => p.$id);

    const { documents: roles } = await databases.listDocuments(
      dbId,
      "user_roles",
      [Query.equal("user_id", userIds)]
    );

    const rolesMap = roles.reduce((acc: any, role: any) => {
      if (!acc[role.user_id]) acc[role.user_id] = [];
      acc[role.user_id].push(role);
      return acc;
    }, {});

    const joinedUsers = profiles.map(profile => ({
      ...profile,
      user_roles: rolesMap[profile.$id] || []
    }));

    setUsers(joinedUsers);
  };

  const fetchVerificationRequests = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents: requests } = await databases.listDocuments(
      dbId,
      "verification_requests",
      [Query.equal("status", "pending"), Query.orderDesc("$createdAt")]
    );

    if (requests.length === 0) {
      setVerificationRequests([]);
      return;
    }

    const userIds = [...new Set(requests.map(r => r.user_id))];
    const { documents: profiles } = await databases.listDocuments(
      dbId,
      "profiles",
      [Query.equal("$id", userIds)]
    );
    const profilesMap = profiles.reduce((acc: any, p: any) => ({ ...acc, [p.$id]: p }), {});

    const joinedRequests = requests.map(req => ({
      ...req,
      profiles: profilesMap[req.user_id]
    }));

    setVerificationRequests(joinedRequests);
  };

  const fetchPosts = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    try {
      const { documents } = await databases.listDocuments(
        dbId,
        "posts",
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      );
      setPosts(documents);
    } catch (e) {
      console.warn("Could not fetch posts:", e);
    }
  };

  const fetchProducts = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    try {
      const { documents } = await databases.listDocuments(
        dbId,
        "products",
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      );
      setProducts(documents);
    } catch (e) {
      console.warn("Could not fetch products:", e);
    }
  };

  const fetchAdminSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Failed to load admin settings", error);
      return;
    }

    if (data && data.length > 0) {
      setAdminSettings({ ...defaultAdminSettings, ...data[0] });
    }
  };

  const fetchAdvertisements = async () => {
    const { data, error } = await supabase
      .from("advertisements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load advertisements", error);
      return;
    }

    setAdvertisements(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,is_available,price")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Failed to load products", error);
      return;
    }

    setProducts(data || []);
  };

  const handleAdminSettingChange = async (
    key: keyof AdminSettingsState,
    value: boolean
  ) => {
    if (!adminId) {
      toast.error("Missing admin session");
      return;
    }

    const previous = { ...adminSettings };
    const next = { ...adminSettings, [key]: value };
    setSettingsSavingKey(key);
    setAdminSettings(next);

    const { data, error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          id: next.id,
          force_dark_mode: next.force_dark_mode,
          enable_beta_features: next.enable_beta_features,
          enable_ads_portal: next.enable_ads_portal,
          enable_bulk_tools: next.enable_bulk_tools,
          updated_by: adminId,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    setSettingsSavingKey(null);

    if (error) {
      toast.error("Failed to update platform setting");
      setAdminSettings(previous);
      return;
    }

    setAdminSettings(data as AdminSettingsState);
    toast.success("Admin setting updated");
  };

  const handleVerifyUser = async (requestId: string, _userId: string, approve: boolean) => {
    if (!adminId) {
      toast.error("Missing admin session");
      return;
    }

    try {
<<<<<<< HEAD
      const { error } = await supabase.rpc("admin_handle_verification", {
        _admin_id: adminId,
        _request_id: requestId,
        _approve: approve,
        _notes: approve ? null : "Rejected via dashboard",
      });
=======
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      await databases.updateDocument(
        dbId,
        "verification_requests",
        requestId,
        {
          status: approve ? "approved" : "rejected",
          admin_notes: approve ? "User verified" : "Verification rejected",
        }
      );

      if (approve) {
        const { documents: roles } = await databases.listDocuments(
          dbId,
          "user_roles",
          [Query.equal("user_id", userId)]
        );

        if (roles.length > 0) {
          await databases.updateDocument(
            dbId,
            "user_roles",
            roles[0].$id,
            { is_verified: true }
          );
        }
      }

      await databases.createDocument(
        dbId,
        "notifications",
        ID.unique(),
        {
          user_id: userId,
          type: "verification",
          title: approve ? "Verification Approved" : "Verification Rejected",
          message: approve
            ? "Congratulations! Your account has been verified."
            : "Your verification request has been rejected. Please contact support.",
        }
      );
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760

      if (error) throw error;

      toast.success(approve ? "User verified successfully!" : "Request rejected");
      fetchVerificationRequests();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

<<<<<<< HEAD
  const handleBanToggle = async (userId: string, ban: boolean) => {
    if (!adminId) {
      toast.error("Missing admin session");
      return;
    }

    try {
      setBanLoadingId(userId);
      const { error } = await supabase.rpc("admin_toggle_ban", {
        _admin_id: adminId,
        _target_user: userId,
        _ban: ban,
      });

      setBanLoadingId(null);

      if (error) throw error;

      toast.success(ban ? "User banned" : "User reinstated");
      fetchUsers();
    } catch (error: any) {
      setBanLoadingId(null);
=======
  // NEW: Ban/Unban User
  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      await databases.updateDocument(
        dbId,
        "profiles",
        userId,
        {
          is_banned: ban,
          ban_reason: ban ? banReason : null,
        }
      );

      // Send notification
      await databases.createDocument(
        dbId,
        "notifications",
        ID.unique(),
        {
          user_id: userId,
          type: "account",
          title: ban ? "Account Suspended" : "Account Reinstated",
          message: ban
            ? `Your account has been suspended. Reason: ${banReason || "Violation of community guidelines"}`
            : "Your account has been reinstated. Welcome back!",
        }
      );

      toast.success(ban ? "User banned successfully" : "User unbanned successfully");
      setBanDialogOpen(false);
      setBanReason("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
      toast.error(error.message);
    }
  };

<<<<<<< HEAD
  const handleAdFieldChange = (field: string, value: string) => {
    setNewAd((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAd = async () => {
    if (!adminId) {
      toast.error("Missing admin session");
      return;
    }

    if (!newAd.title.trim()) {
      toast.error("Title is required");
=======
  // NEW: Change User Role
  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      const { documents: roles } = await databases.listDocuments(
        dbId,
        "user_roles",
        [Query.equal("user_id", userId)]
      );

      if (roles.length > 0) {
        await databases.updateDocument(
          dbId,
          "user_roles",
          roles[0].$id,
          { role: newRole }
        );
      } else {
        await databases.createDocument(
          dbId,
          "user_roles",
          ID.unique(),
          {
            user_id: userId,
            role: newRole,
            is_verified: false,
          }
        );
      }

      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // NEW: Hide/Unhide Post
  const handleHidePost = async (postId: string, hide: boolean, reason?: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      await databases.updateDocument(
        dbId,
        "posts",
        postId,
        {
          is_hidden: hide,
          hidden_reason: hide ? (reason || "Flagged by admin") : null,
        }
      );

      toast.success(hide ? "Post hidden" : "Post restored");
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // NEW: Hide/Unhide Product
  const handleHideProduct = async (productId: string, hide: boolean, reason?: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      await databases.updateDocument(
        dbId,
        "products",
        productId,
        {
          is_hidden: hide,
          hidden_reason: hide ? (reason || "Flagged by admin") : null,
        }
      );

      toast.success(hide ? "Product hidden from marketplace" : "Product restored");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // NEW: Broadcast Notification
  const handleBroadcastNotification = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Please fill in both title and message");
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
      return;
    }

    try {
<<<<<<< HEAD
      setAdSaving(true);
      const { error } = await supabase.rpc("admin_upsert_advertisement", {
        _admin_id: adminId,
        _payload: newAd,
      });

      setAdSaving(false);

      if (error) throw error;

      toast.success("Advertisement saved");
      setNewAd({ title: "", body: "", image_url: "", cta_label: "", cta_link: "" });
      fetchAdvertisements();
    } catch (error: any) {
      setAdSaving(false);
=======
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      // Get all user IDs
      const { documents: profiles } = await databases.listDocuments(
        dbId,
        "profiles",
        [Query.select(["$id"]), Query.limit(1000)]
      );

      // Create notification for each user
      const promises = profiles.map(profile =>
        databases.createDocument(
          dbId,
          "notifications",
          ID.unique(),
          {
            user_id: profile.$id,
            type: "announcement",
            title: broadcastTitle,
            message: broadcastMessage,
          }
        ).catch(e => console.warn(`Failed to notify ${profile.$id}:`, e))
      );

      await Promise.all(promises);

      toast.success(`Broadcast sent to ${profiles.length} users`);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (error: any) {
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
      toast.error(error.message);
    }
  };

<<<<<<< HEAD
  const handleAdToggle = async (adId: string, nextState: boolean) => {
    if (!adminId) {
      toast.error("Missing admin session");
      return;
    }

    const { error } = await supabase.rpc("admin_upsert_advertisement", {
      _admin_id: adminId,
      _payload: { id: adId, is_active: nextState },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    fetchAdvertisements();
    toast.success(`Ad ${nextState ? "activated" : "paused"}`);
  };

  const toggleProductSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds((prev) =>
      checked ? [...new Set([...prev, productId])] : prev.filter((id) => id !== productId)
    );
  };

  const handleBulkAction = async (
    action: "mark_unavailable" | "mark_available" | "adjust_price_percent",
    extraPayload: Record<string, unknown> = {}
  ) => {
    if (!adminId) {
      toast.error("Missing admin session");
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error("Select at least one product");
      return;
    }

    const { data, error } = await supabase.rpc("admin_bulk_product_action", {
      _admin_id: adminId,
      _action: action,
      _product_ids: selectedProductIds,
      _payload: extraPayload,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Action applied to ${data ?? 0} product(s)`);
    setSelectedProductIds([]);
    fetchProducts();
  };
=======
  // Filter users by search
  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter content based on hidden toggle
  const filteredPosts = showHiddenContent ? posts : posts.filter(p => !p.is_hidden);
  const filteredProducts = showHiddenContent ? products : products.filter(p => !p.is_hidden);
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Admin Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="verification">
            Verification
            {verificationRequests.length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {verificationRequests.length}
              </Badge>
            )}
          </TabsTrigger>
<<<<<<< HEAD
          <TabsTrigger value="settings">Admin Settings</TabsTrigger>
          <TabsTrigger value="ads">Advertisements</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Tools</TabsTrigger>
=======
          <TabsTrigger value="moderation">Content</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="exports">Data Exports</TabsTrigger>
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage platform users, roles, and access</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.$id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${user.is_banned ? "bg-destructive/10 border-destructive/50" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.full_name}</p>
                        {user.is_banned && (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.location || "No location"}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.user_roles?.map((role: any, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {role.role} {role.is_verified && "✓"}
                          </Badge>
                        ))}
                        {user.is_banned && (
                          <Badge variant="destructive">Banned</Badge>
                        )}
                      </div>
                    </div>
<<<<<<< HEAD
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <Button
                        size="sm"
                        variant={user.is_banned ? "outline" : "destructive"}
                        onClick={() => handleBanToggle(user.id, !user.is_banned)}
                        disabled={banLoadingId === user.id}
                      >
                        <BanIcon className="mr-2 h-4 w-4" />
                        {user.is_banned ? "Unban" : "Ban"}
                      </Button>
=======

                    <div className="flex items-center gap-2">
                      {/* Role Selector */}
                      <Select
                        defaultValue={user.user_roles?.[0]?.role || "user"}
                        onValueChange={(value) => handleChangeRole(user.$id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="farmer">Farmer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Ban/Unban Button */}
                      {user.is_banned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBanUser(user.$id, false)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Dialog open={banDialogOpen && selectedUser?.$id === user.$id} onOpenChange={(open) => {
                          setBanDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Ban
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ban User</DialogTitle>
                              <DialogDescription>
                                This will prevent {user.full_name} from accessing the platform.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Reason for ban</Label>
                                <Textarea
                                  placeholder="Enter reason..."
                                  value={banReason}
                                  onChange={(e) => setBanReason(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleBanUser(user.$id, true)}
                              >
                                Confirm Ban
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Requests</CardTitle>
              <CardDescription>Review and approve user verifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationRequests.map((request) => (
                  <div
                    key={request.$id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{request.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(request.$createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerifyUser(request.$id, request.user_id, true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVerifyUser(request.$id, request.user_id, false)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}

                {verificationRequests.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">No pending verification requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

<<<<<<< HEAD
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Controls</CardTitle>
              <CardDescription>Toggle experiments and global behaviors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  key: "force_dark_mode",
                  title: "Force dark mode",
                  description: "Apply dark theme across the entire product regardless of user setting.",
                  icon: <Sparkles className="h-4 w-4 text-muted-foreground" />,
                },
                {
                  key: "enable_beta_features",
                  title: "Enable beta experiences",
                  description: "Expose in-development features to all admins and opted-in testers.",
                  icon: <Sparkles className="h-4 w-4 text-muted-foreground" />,
                },
                {
                  key: "enable_ads_portal",
                  title: "Ads portal",
                  description: "Allow admins to manage sponsored placements.",
                  icon: <Megaphone className="h-4 w-4 text-muted-foreground" />,
                },
                {
                  key: "enable_bulk_tools",
                  title: "Bulk operations",
                  description: "Show power tools for mass product updates.",
                  icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
                },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {setting.icon}
                      <Label>{setting.title}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={Boolean((adminSettings as any)[setting.key])}
                    disabled={!adminId || settingsSavingKey === setting.key}
                    onCheckedChange={(checked) =>
                      handleAdminSettingChange(setting.key as keyof AdminSettingsState, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create placement</CardTitle>
              <CardDescription>Push new featured ads to the marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="ad-title">Title</Label>
                  <Input
                    id="ad-title"
                    value={newAd.title}
                    onChange={(e) => handleAdFieldChange("title", e.target.value)}
                    placeholder="Harvest Sale"
                  />
                </div>
                <div>
                  <Label htmlFor="ad-image">Image URL</Label>
                  <Input
                    id="ad-image"
                    value={newAd.image_url}
                    onChange={(e) => handleAdFieldChange("image_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="ad-cta-label">CTA Label</Label>
                  <Input
                    id="ad-cta-label"
                    value={newAd.cta_label}
                    onChange={(e) => handleAdFieldChange("cta_label", e.target.value)}
                    placeholder="Shop now"
                  />
                </div>
                <div>
                  <Label htmlFor="ad-cta-link">CTA Link</Label>
                  <Input
                    id="ad-cta-link"
                    value={newAd.cta_link}
                    onChange={(e) => handleAdFieldChange("cta_link", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ad-body">Body copy</Label>
                <Textarea
                  id="ad-body"
                  value={newAd.body}
                  onChange={(e) => handleAdFieldChange("body", e.target.value)}
                  placeholder="Highlight your campaign..."
                />
              </div>
              <Button onClick={handleSaveAd} disabled={adSaving || !adminId}>
                <Megaphone className="mr-2 h-4 w-4" />
                Publish placement
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live placements</CardTitle>
              <CardDescription>Manage active and paused creatives.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {advertisements.length === 0 && (
                <p className="text-sm text-muted-foreground">No advertisements yet.</p>
              )}
              {advertisements.map((ad) => (
                <div key={ad.id} className="border rounded-lg p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{ad.title}</p>
                    <p className="text-sm text-muted-foreground">{ad.body || "No copy"}</p>
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                      {ad.cta_label && <span>CTA: {ad.cta_label}</span>}
                      {ad.cta_link && <span>Link: {ad.cta_link}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ad.is_active ? "default" : "secondary"}>
                      {ad.is_active ? "Active" : "Paused"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdToggle(ad.id, !ad.is_active)}
                    >
                      {ad.is_active ? "Pause" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk actions</CardTitle>
              <CardDescription>Select products and run global updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <Label htmlFor="price-delta">Adjust price (%)</Label>
                  <Input
                    id="price-delta"
                    type="number"
                    value={priceDelta}
                    onChange={(e) => setPriceDelta(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleBulkAction("mark_available")}>
                    Mark available
                  </Button>
                  <Button variant="outline" onClick={() => handleBulkAction("mark_unavailable")}>
                    Mark unavailable
                  </Button>
                  <Button
                    variant="default"
                    onClick={() =>
                      handleBulkAction("adjust_price_percent", {
                        percentage: Number(priceDelta) || 0,
                      })
                    }
                  >
                    Apply % change
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Selected {selectedProductIds.length} of {products.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedProductIds((prev) =>
                      prev.length === products.length ? [] : products.map((p) => p.id)
                    )
                  }
                >
                  {selectedProductIds.length === products.length ? "Clear selection" : "Select all"}
                </Button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3">
                {products.map((product) => {
                  const checked = selectedProductIds.includes(product.id);
                  return (
                    <div key={product.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${product.price} • {product.is_available ? "Available" : "Hidden"}
                        </p>
                      </div>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleProductSelection(product.id, Boolean(value))
                        }
                      />
                    </div>
                  );
                })}
              </div>
=======
        {/* Content Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Content Moderation</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHiddenContent(!showHiddenContent)}
            >
              {showHiddenContent ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showHiddenContent ? "Hide Hidden Content" : "Show Hidden Content"}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Posts ({filteredPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.$id}
                      className={`p-3 border rounded-lg ${post.is_hidden ? "bg-muted/50 opacity-60" : ""}`}
                    >
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.$createdAt).toLocaleDateString()}
                        </span>
                        {post.is_hidden ? (
                          <Button size="sm" variant="ghost" onClick={() => handleHidePost(post.$id, false)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleHidePost(post.$id, true)}>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredPosts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No posts to moderate</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.$id}
                      className={`p-3 border rounded-lg ${product.is_hidden ? "bg-muted/50 opacity-60" : ""}`}
                    >
                      <div className="flex justify-between">
                        <p className="font-medium">{product.name}</p>
                        <span className="text-sm text-primary">${product.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {product.category}
                        </span>
                        {product.is_hidden ? (
                          <Button size="sm" variant="ghost" onClick={() => handleHideProduct(product.$id, false)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleHideProduct(product.$id, true)}>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No products to moderate</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Broadcast Notification
              </CardTitle>
              <CardDescription>
                Send a notification to all users on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  This will send a notification to all {stats.users} users. Use responsibly.
                </p>
              </div>

              <div>
                <Label>Notification Title</Label>
                <Input
                  placeholder="e.g., Platform Update"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Enter your announcement message..."
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleBroadcastNotification}
                disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Broadcast
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                System Data Export
              </CardTitle>
              <CardDescription>
                Download comprehensive system data including users, products, orders, chat logs, and activity logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-4">
                <div className="p-4 border rounded-lg bg-secondary/20 w-full">
                  <h4 className="font-semibold mb-2">Available Datasets</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Use List (Profiles & Roles)</li>
                    <li>Product Catalog</li>
                    <li>Order History</li>
                    <li>Chat Logs (Messages)</li>
                    <li>Activity Logs (Notifications & Alerts)</li>
                  </ul>
                </div>
                <Button onClick={async () => {
                  toast.info("Starting export...");
                  const result = await exportSystemData();
                  if (result.success) {
                    toast.success(`Export complete! Processed ${Object.values(result.count || {}).reduce((a, b) => a + b, 0)} records.`);
                  } else {
                    toast.error("Export failed. Check console.");
                  }
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download All System Data
                </Button>
              </div>
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
