import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import SocialFeedEnhanced from "@/components/SocialFeedEnhanced";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const Social = () => {
  const { loading } = useAuth();

  // No redirect: Social feed is viewable by anonymous users.
  // Component-level checks inside SocialFeedEnhanced guard restricted actions.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed bottom-4 left-4 z-50">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-6">
        <SocialFeedEnhanced />
      </div>
    </div>
  );
};

export default Social;
