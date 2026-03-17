import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading: authLoading, role } = useAuth();

    // Show loading if auth is loading OR if we are authenticated but the role hasn't resolved yet
    if (authLoading || (isAuthenticated && role === null)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Verifying permissions...</p>
                </div>
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
