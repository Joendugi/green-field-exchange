import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Marketplace from "@/components/Marketplace";
import MyProducts from "@/components/MyProducts";
import MyOrders from "@/components/MyOrders";
import SocialFeedEnhanced from "@/components/SocialFeedEnhanced";
import Messages from "@/components/Messages";
import AIAssistant from "@/components/AIAssistant";
import Profile from "@/components/Profile";
import AdminDashboard from "@/components/AdminDashboard";
import Settings from "@/components/Settings";
import Onboarding from "@/components/Onboarding";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        <Tabs defaultValue="marketplace" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 mb-6">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            {userRole === "farmer" && <TabsTrigger value="products">My Products</TabsTrigger>}
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {userRole === "admin" && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="marketplace">
            <Marketplace />
          </TabsContent>

          {userRole === "farmer" && (
            <TabsContent value="products">
              <MyProducts />
            </TabsContent>
          )}

          <TabsContent value="orders">
            <MyOrders userRole={userRole} />
          </TabsContent>

          <TabsContent value="social">
            <SocialFeedEnhanced />
          </TabsContent>

          <TabsContent value="messages">
            <Messages />
          </TabsContent>

          <TabsContent value="ai">
            <AIAssistant />
          </TabsContent>

          <TabsContent value="profile">
            <Profile />
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
