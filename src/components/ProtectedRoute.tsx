import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const { loading, isAuthenticated } = useAuth();

    useEffect(() => {
        // Only redirect if we are definitely NOT authenticated and NOT loading
        if (!loading && !isAuthenticated) {
            navigate("/auth");
        }
    }, [isAuthenticated, loading, navigate]);

    // While auth state is still resolving, render children so they can
    // show their own loading spinner without an extra wrapper flash.
    if (loading) {
        return <>{children}</>;
    }

    // Guard only on isAuthenticated — the profile (user) object may be null
    // if the profile fetch failed, but we should still let the page render
    // rather than showing a blank screen. Pages handle a null user gracefully.
    return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
