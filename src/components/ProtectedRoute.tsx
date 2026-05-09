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
    if (loading) {
        return <>{children}</>;
    }

    return isAuthenticated && user ? <>{children}</> : null;
};

export default ProtectedRoute;
