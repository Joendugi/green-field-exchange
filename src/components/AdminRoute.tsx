import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading: authLoading, role } = useAuth();

    // Show loading if auth is loading OR if we are authenticated but the role hasn't resolved yet
    if (authLoading || (isAuthenticated && role === null)) {
        return <>{children}</>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" />;
    }

    if (role !== "admin") {
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};

export default AdminRoute;
