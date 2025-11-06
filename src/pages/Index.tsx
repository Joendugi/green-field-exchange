import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sprout, ShoppingCart, Users, TrendingUp } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import Navbar from "@/components/Navbar";
import Marketplace from "@/components/Marketplace";
import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoggedIn) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-6">
        <Marketplace />
      </div>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="relative h-[600px] overflow-hidden">
        <img src={heroBanner} alt="Farm produce" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/50" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Sprout className="h-12 w-12 text-primary" />
                <h1 className="text-5xl font-bold text-foreground">AgriLink</h1>
              </div>
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Connecting Farmers Directly with Buyers
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                A marketplace platform that empowers farmers and creates direct connections with buyers for fresh agricultural products.
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose AgriLink?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <ShoppingCart className="h-12 w-12 text-primary mx-auto mb-4" />
            <h4 className="text-xl font-semibold mb-2">Direct Marketplace</h4>
            <p className="text-muted-foreground">
              Buy fresh produce directly from farmers without middlemen
            </p>
          </div>
          <div className="text-center p-6">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h4 className="text-xl font-semibold mb-2">Community</h4>
            <p className="text-muted-foreground">
              Connect with farmers and buyers, share knowledge and experiences
            </p>
          </div>
          <div className="text-center p-6">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h4 className="text-xl font-semibold mb-2">AI Assistant</h4>
            <p className="text-muted-foreground">
              Get agricultural advice and market insights powered by AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
