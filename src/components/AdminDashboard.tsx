import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    fetchAdminSettings();
    fetchAdvertisements();
    fetchProducts();
  }, []);

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: orderCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { data: orders } = await supabase
      .from("orders")
      .select("total_price");

    const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_price.toString()), 0) || 0;

    setStats({
      users: userCount || 0,
      products: productCount || 0,
      orders: orderCount || 0,
      revenue,
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles (role, is_verified)
      `)
      .order("created_at", { ascending: false });

    setUsers(data || []);
  };

  const fetchVerificationRequests = async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setVerificationRequests(data || []);
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
      const { error } = await supabase.rpc("admin_handle_verification", {
        _admin_id: adminId,
        _request_id: requestId,
        _approve: approve,
        _notes: approve ? null : "Rejected via dashboard",
      });

      if (error) throw error;

      toast.success(approve ? "User verified successfully!" : "Request rejected");
      fetchVerificationRequests();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
      toast.error(error.message);
    }
  };

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
      return;
    }

    try {
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
      toast.error(error.message);
    }
  };

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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Admin Dashboard</h2>

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

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="verification">
            Verification Requests
            {verificationRequests.length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {verificationRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Admin Settings</TabsTrigger>
          <TabsTrigger value="ads">Advertisements</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{user.full_name}</p>
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{request.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerifyUser(request.id, request.user_id, true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVerifyUser(request.id, request.user_id, false)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
