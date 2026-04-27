import { useEffect, useState, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  AdminDashboardContent as AdminDashboard,
  MyOrders,
  MyProducts,
  Onboarding,
  AIAssistant,
  FarmerAnalytics,
  OffersManager,
  Profile,
  Settings
} from "@/components/LazyComponents";

const LazyLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<DashboardSkeleton />}>
    {children}
  </Suspense>
);

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
      const saved = window.localStorage.getItem(TAB_STORAGE_KEY);
      if (saved === "admin" && role !== "admin") return "profile";
      return saved || (isAuthenticated ? "profile" : "products");
    }
    return isAuthenticated ? "profile" : "products";
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
    if (!loading && isAuthenticated && user && !user.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [loading, isAuthenticated, user]);

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
            <div className="relative mb-6">
              <div className="overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className={`inline-flex w-auto md:w-full min-w-full md:grid ${isAuthenticated ?
                  (role === "admin" ? "md:grid-cols-6" : "md:grid-cols-5")
                  : "grid-cols-1"} justify-start md:justify-center`}>
                  {isAuthenticated && <TabsTrigger value="profile">Profile</TabsTrigger>}
                  {isAuthenticated && <TabsTrigger value="orders">Orders</TabsTrigger>}
                  <TabsTrigger value="products">My Products</TabsTrigger>
                  {isAuthenticated && <TabsTrigger value="insights">Insights</TabsTrigger>}
                  {/* {isAuthenticated && <TabsTrigger value="negotiations">Offers</TabsTrigger>} */}
                  {isAuthenticated && <TabsTrigger value="settings">Settings</TabsTrigger>}
                  {role === "admin" && <TabsTrigger value="admin" className="text-primary font-bold">Admin</TabsTrigger>}
                </TabsList>
              </div>
            </div>

            <TabsContent value="profile">
              <LazyLoader>
                <Profile />
              </LazyLoader>
            </TabsContent>

            <TabsContent value="orders">
              <LazyLoader>
                <MyOrders />
              </LazyLoader>
            </TabsContent>

            <TabsContent value="products">
              <LazyLoader>
                <MyProducts />
              </LazyLoader>
            </TabsContent>

            <TabsContent value="insights">
              <LazyLoader>
                <FarmerAnalytics />
              </LazyLoader>
            </TabsContent>

            {/* <TabsContent value="negotiations">
              <LazyLoader>
                <OffersManager />
              </LazyLoader>
            </TabsContent> */}

            <TabsContent value="settings">
              <LazyLoader>
                <Settings />
              </LazyLoader>
            </TabsContent>

            {role === "admin" && (
              <TabsContent value="admin">
                <LazyLoader>
                  <AdminDashboard />
                </LazyLoader>
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
      </div>
    </div>
  </div>
);

const OrdersSkeleton = () => <Skeleton className="h-40 w-full" />;
const ProductsSkeleton = () => <Skeleton className="h-40 w-full" />;

export default Dashboard;
