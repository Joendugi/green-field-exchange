import { useEffect, useState } from "react";
import { account, databases } from "@/lib/appwrite";
import { Query } from "appwrite";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const defaultTab = searchParams.get("tab") || "profile";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await account.get();

        if (!user) {
          navigate("/auth");
          return;
        }

        // Get user role
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const roleData = await databases.listDocuments(
          dbId,
          "user_roles",
          [Query.equal("user_id", user.$id)]
        );

        const currentRole = roleData.documents[0]?.role || null;
        setUserRole(currentRole);

        // Check if onboarding is needed
        // 1. Check local storage first (fastest)
        const localStatus = localStorage.getItem(`onboarding_completed_${user.$id}`);
        if (localStatus === "true") {
          setShowOnboarding(false);
          setLoading(false);
          return;
        }

        // 2. Check Database
        try {
          const profileData = await databases.getDocument(
            dbId,
            "profiles",
            user.$id
          );

          if (!profileData?.onboarding_completed) {
            setShowOnboarding(true);
          }
        } catch (e) {
          // If profile fails, only show if we don't have local record
          setShowOnboarding(true);
        }

      } catch (error) {
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Onboarding open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">My Products</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {userRole === "admin" && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile">
            <Profile />
          </TabsContent>

          <TabsContent value="orders">
            <MyOrders userRole={userRole} />
          </TabsContent>

          <TabsContent value="products">
            <MyProducts />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>

          {userRole === "admin" && (
            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
