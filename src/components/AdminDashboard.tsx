import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, ShoppingCart, TrendingUp, Download, Activity, Badge as BadgeIcon, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/dataExport";
import { Id } from "../../convex/_generated/dataModel";

import AdminPrivilegeManager from "./AdminPrivilegeManager";
import VerificationRequestManager from "./VerificationRequestManager";
import { UsersTab } from "./admin/UsersTab";
import { LogsTab } from "./admin/LogsTab";
import { BroadcastTab } from "./admin/BroadcastTab";
import { EmailLogsTab } from "./admin/EmailLogsTab";
import { SettingsTab } from "./admin/SettingsTab";
import { AdsTab } from "./admin/AdsTab";
import { ContentTab } from "./admin/ContentTab";
import type { NewAd } from "./admin/AdsTab";

type SettingsKey = "force_dark_mode" | "enable_beta_features" | "enable_ads_portal" | "enable_bulk_tools";

type AdminSettingsState = {
  _id?: Id<"admin_settings">;
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
  // ─── Queries ────────────────────────────────────────────────────────────
  const stats = useQuery(api.admin.getStats) || { users: 0, products: 0, orders: 0, revenue: 0 };
  const users = useQuery(api.admin.listUsers);
  const verificationRequests = useQuery(api.admin.listVerificationRequests);
  const posts = useQuery(api.admin.listPosts);
  const products = useQuery(api.admin.listProducts);
  const advertisements = useQuery(api.advertisements.list);
  const adminSettingsData = useQuery(api.adminSettings.get);
  const auditLogs = useQuery(api.admin.listAuditLogs) ?? [];
  const emailLogs = useQuery(api.admin.listEmailLogs);
  const recentActivity = useQuery(api.admin.getRecentActivity) ?? [];
  const growthStats = useQuery(api.admin.getGrowthStats) ?? [];

  // ─── Mutations ──────────────────────────────────────────────────────────
  const broadcastNotification = useAction(api.admin.broadcastNotification);
  const banUser = useMutation(api.admin.banUser);
  const verifyUser = useMutation(api.admin.handleVerification);
  const updateRole = useMutation(api.admin.updateRole);
  const updateSettings = useMutation(api.adminSettings.update);
  const upsertAd = useMutation(api.advertisements.upsert);
  const toggleFeaturedP = useMutation(api.admin.toggleFeatured);
  const hidePostM = useMutation(api.admin.hidePost);
  const hideProductM = useMutation(api.admin.hideProduct);

  // ─── State ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [showHiddenContent, setShowHiddenContent] = useState(false);
  const [settingsSavingKey, setSettingsSavingKey] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  // ─── Loading guard (AFTER all hooks) ────────────────────────────────────
  const isLoading =
    users === undefined ||
    verificationRequests === undefined ||
    posts === undefined ||
    products === undefined ||
    advertisements === undefined ||
    adminSettingsData === undefined;

  if (isLoading) return <AdminDashboardSkeleton />;

  const adminSettings: AdminSettingsState = adminSettingsData
    ? { ...adminSettingsData, _id: adminSettingsData._id }
    : defaultAdminSettings;

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleExportData = async () => {
    try {
      toast.info("Preparing system data...");
      const date = new Date().toISOString().split("T")[0];
      if (users.length > 0) exportToCSV(users, `system_users_${date}.csv`);
      if (products.length > 0) exportToCSV(products, `system_products_${date}.csv`);
      toast.success("System data exported");
    } catch (e: any) {
      toast.error("Export failed: " + e.message);
    }
  };

  const handleAdminSettingChange = async (key: SettingsKey, value: boolean) => {
    setSettingsSavingKey(key);
    try {
      await updateSettings({
        force_dark_mode: key === "force_dark_mode" ? value : adminSettings.force_dark_mode,
        enable_beta_features: key === "enable_beta_features" ? value : adminSettings.enable_beta_features,
        enable_ads_portal: key === "enable_ads_portal" ? value : adminSettings.enable_ads_portal,
        enable_bulk_tools: key === "enable_bulk_tools" ? value : adminSettings.enable_bulk_tools,
      });
      toast.success("Setting updated");
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
    setSettingsSavingKey(null);
  };

  const handleBanUser = async (userId: Id<"users">, ban: boolean) => {
    try {
      await banUser({ userId, ban, reason: banReason });
      toast.success(ban ? "User banned" : "User unbanned");
      setBanDialogOpen(false);
      setBanReason("");
      setSelectedUser(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleChangeRole = async (userId: Id<"users">, role: string) => {
    try {
      await updateRole({ userId, role });
      toast.success(`Role updated to ${role}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }
    const loadingToast = toast.loading("Sending broadcast...");
    try {
      await broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        sendEmail: sendEmail
      });
      toast.dismiss(loadingToast);
      toast.success("Broadcast sent successfully");
      setBroadcastTitle("");
      setBroadcastMessage("");
      setSendEmail(false);
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error(e.message);
    }
  };

  const handleSaveAd = async (ad: NewAd) => {
    try {
      await upsertAd({
        title: ad.title,
        description: ad.description,
        image_url: ad.image_url,
        target_url: ad.target_url,
        status: ad.status,
        budget: typeof ad.budget === "string" ? parseFloat(ad.budget) : ad.budget,
      });
      toast.success("Advertisement published");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleAd = async (adId: Id<"advertisements">, active: boolean) => {
    try {
      const current = advertisements.find((a: any) => a._id === adId);
      if (!current) return;
      await upsertAd({
        id: adId,
        title: current.title,
        description: current.description ?? "",
        image_url: current.image_url ?? "",
        target_url: current.target_url,
        status: active ? "active" : "paused",
        budget: current.budget,
      });
      toast.success(`Ad ${active ? "activated" : "paused"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleHidePost = async (postId: Id<"posts">, hide: boolean) => {
    try {
      await hidePostM({ postId, hide });
      toast.success(hide ? "Post hidden" : "Post restored");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleHideProduct = async (productId: Id<"products">, hide: boolean) => {
    try {
      await hideProductM({ productId, hide });
      toast.success(hide ? "Product hidden" : "Product restored");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleFeatured = async (productId: Id<"products">, featured: boolean) => {
    try {
      await toggleFeaturedP({ productId, featured });
      toast.success(featured ? "Product featured" : "Product unfeatured");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" /> Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: stats.users, icon: Users },
          { label: "Total Products", value: stats.products, icon: Package },
          { label: "Total Orders", value: stats.orders, icon: ShoppingCart },
          { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-9 h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="privileges">Privileges</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="moderation">Content</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="email-logs">Emails</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real User Growth Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>User Growth</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-48 flex items-end justify-between gap-2 border-b pb-4 px-4">
                {growthStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground m-auto">No data yet</p>
                ) : (() => {
                  const maxVal = Math.max(...growthStats.map(m => m.users), 1);
                  return growthStats.map((m, idx) => (
                    <div key={idx} className="relative flex-1 group">
                      <div
                        className="bg-primary rounded-t-sm transition-all duration-700 hover:brightness-110 w-full"
                        style={{ height: `${Math.max((m.users / maxVal) * 100, m.users > 0 ? 8 : 2)}%` }}
                        title={`${m.users} users`}
                      />
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">{m.label}</p>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>

            {/* Real Revenue Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <CardTitle>Revenue Trends</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-48 flex items-end justify-between gap-2 border-b pb-4 px-4">
                {growthStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground m-auto">No data yet</p>
                ) : (() => {
                  const maxRev = Math.max(...growthStats.map(m => m.revenue), 1);
                  return growthStats.map((m, idx) => (
                    <div key={idx} className="relative flex-1 group">
                      <div
                        className="bg-emerald-500 rounded-t-sm transition-all duration-700 hover:brightness-110 w-full"
                        style={{ height: `${Math.max((m.revenue / maxRev) * 100, m.revenue > 0 ? 8 : 2)}%` }}
                        title={`$${m.revenue.toFixed(2)}`}
                      />
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">{m.label}</p>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Live Platform Pulse */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
                <CardTitle>Live Platform Pulse</CardTitle>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px]">Real-time</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent activity in the last 7 days.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {recentActivity.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
                    >
                      <span className="text-lg shrink-0">{event.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{event.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(event.time).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 capitalize"
                      >
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTab
            users={users}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            banDialogOpen={banDialogOpen}
            setBanDialogOpen={setBanDialogOpen}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            banReason={banReason}
            setBanReason={setBanReason}
            onChangeRole={handleChangeRole}
            onBanUser={handleBanUser}
          />
        </TabsContent>

        <TabsContent value="privileges" className="space-y-4">
          <AdminPrivilegeManager />
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <VerificationRequestManager />
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <ContentTab
            posts={posts}
            products={products}
            showHidden={showHiddenContent}
            onToggleShowHidden={() => setShowHiddenContent((p) => !p)}
            onHidePost={handleHidePost}
            onHideProduct={handleHideProduct}
            onToggleFeatured={handleToggleFeatured}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogsTab auditLogs={auditLogs} />
        </TabsContent>

        <TabsContent value="email-logs" className="space-y-4">
          <EmailLogsTab logs={emailLogs} />
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-4">
          <BroadcastTab
            broadcastTitle={broadcastTitle}
            setBroadcastTitle={setBroadcastTitle}
            broadcastMessage={broadcastMessage}
            setBroadcastMessage={setBroadcastMessage}
            sendEmail={sendEmail}
            setSendEmail={setSendEmail}
            onSend={handleBroadcast}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab
            adminSettings={adminSettings}
            onSettingChange={handleAdminSettingChange}
            savingKey={settingsSavingKey}
          />
        </TabsContent>

        <TabsContent value="ads">
          <AdsTab
            advertisements={advertisements}
            onSaveAd={handleSaveAd}
            onToggleAd={handleToggleAd}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

const AdminDashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 flex-shrink-0" />
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
