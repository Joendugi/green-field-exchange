import { createContext, useContext, ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

interface AuthContextType {
    user: any; // We'll store the profile document here
    role: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
    const { signOut } = useAuthActions();

    // Fetch profile if authenticated
    const profile = useQuery(api.users.getProfile, isAuthenticated ? {} : "skip");
    const roleData = useQuery(api.users.getRole, isAuthenticated ? {} : "skip");

    const loading = authLoading || (isAuthenticated && (profile === undefined || roleData === undefined));

    const logout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user: profile,
            role: roleData?.role || null,
            loading,
            isAuthenticated,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
