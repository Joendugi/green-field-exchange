import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import MyProducts from "@/components/MyProducts";
import MyOrders from "@/components/MyOrders";
import Profile from "@/components/Profile";
import AdminDashboard from "@/components/AdminDashboard";
import Settings from "@/components/Settings";
import Onboarding from "@/components/Onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const TAB_STORAGE_KEY = "dashboard:last-tab";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role, loading, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab) return urlTab;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(TAB_STORAGE_KEY) || "profile";
    }
    return "profile";
  });

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TAB_STORAGE_KEY, urlTab);
      }
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (activeTab === "admin" && role !== "admin") {
      handleTabChange("profile");
    }
  }, [activeTab, role]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TAB_STORAGE_KEY, value);
    }
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth");
    }

    // Check onboarding logic - we can check user.onboarded
    if (!loading && isAuthenticated && user && !user.onboarded) {
      setShowOnboarding(true);
    }
  }, [loading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Onboarding
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onDismiss={() => setShowOnboarding(false)}
      />
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="products">My Products</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              {role === "admin" && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="profile">
              <Profile />
            </TabsContent>

            <TabsContent value="orders">
              <MyOrders /> // MyOrders should probably get its own role or use global auth
            </TabsContent>

            <TabsContent value="products">
              <MyProducts />
            </TabsContent>

            <TabsContent value="settings">
              <Settings />
            </TabsContent>

            {role === "admin" && (
              <TabsContent value="admin">
                <AdminDashboard />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-12 w-full" />
    <ProfileSkeleton />
    <OrdersSkeleton />
    <ProductsSkeleton />
  </div>
);

const ProfileSkeleton = () => (
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Skeleton key={idx} className="h-10 w-full" />
      ))}
    </div>
  </div>
);

const OrdersSkeleton = () => (
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-6 w-32" />
    {Array.from({ length: 2 }).map((_, idx) => (
      <div key={idx} className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const ProductsSkeleton = () => (
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-6 w-40" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default Dashboard;
