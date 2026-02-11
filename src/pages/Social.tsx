import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import SocialFeedEnhanced from "@/components/SocialFeedEnhanced";
import ThemeToggle from "@/components/ThemeToggle";

const Social = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await account.get();
        setLoading(false);
      } catch (error) {
        navigate("/auth");
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
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-6">
        <SocialFeedEnhanced />
      </div>
    </div>
  );
};

export default Social;
