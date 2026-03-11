import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading: authLoading, role } = useAuth();

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
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
