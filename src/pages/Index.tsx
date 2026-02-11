import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Sprout, ShoppingCart, Users, TrendingUp, ShieldCheck, Star } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import Navbar from "@/components/Navbar";
import Marketplace from "@/components/Marketplace";
import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await account.get();
        setIsLoggedIn(true);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
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
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>Get Started</Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth", { state: { redirectTo: "/" } })}
                >
                  Browse Marketplace
                </Button>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6 max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">2,500+</p>
                    <p className="text-sm text-muted-foreground">Verified farmers in our network</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4.9/5</p>
                    <p className="text-sm text-muted-foreground">Average buyer satisfaction score</p>
                  </div>
                </div>
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
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground text-sm uppercase tracking-wide">Trusted partners</p>
            <p className="text-3xl font-bold mt-2">“AgriLink helped us sell harvests 2x faster.”</p>
            <p className="mt-4 text-muted-foreground">– Maria Ortega, Riverside Cooperative</p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground text-sm uppercase tracking-wide">Buyer spotlight</p>
            <p className="text-3xl font-bold mt-2">“Quality is consistent and negotiation is simple.”</p>
            <p className="mt-4 text-muted-foreground">– Liam Park, FreshMart Produce</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
