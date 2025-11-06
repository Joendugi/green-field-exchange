import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      setUserRole(roleData?.role || null);

      // Check if onboarding is needed
      const { data: profileData } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single();

      if (!profileData?.onboarding_completed) {
        setShowOnboarding(true);
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
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
