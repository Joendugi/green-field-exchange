import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const roleData = useQuery(api.users.getRole, {});

    if (authLoading || roleData === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" />;
    }

    if (roleData?.role !== "admin") {
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};

export default AdminRoute;
