import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const { user, loading, isAuthenticated } = useAuth();

    useEffect(() => {
        // Only redirect of we are definitely NOT authenticated and NOT loading
        if (!loading && !isAuthenticated) {
            navigate("/auth");
        }
    }, [isAuthenticated, loading, navigate]);

    // Show loading if we are still fetching auth state OR 
    // if we are authenticated but the profile (user object) isn't ready yet
    if (loading || (isAuthenticated && !user)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Setting up your account...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated && user ? <>{children}</> : null;
};

export default ProtectedRoute;
