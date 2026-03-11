import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, getMyRole, ProfileRow } from "@/integrations/supabase/profiles";

interface AuthContextType {
    user: ProfileRow | null;
    role: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        void supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            setIsAuthenticated(Boolean(data.session));
            setAuthLoading(false);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(Boolean(session));
            setAuthLoading(false);
        });

        return () => {
            active = false;
            subscription.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!isAuthenticated) {
                if (!active) return;
                setProfile(null);
                setRole(null);
                return;
            }

            try {
                const [p, r] = await Promise.all([getMyProfile(), getMyRole()]);
                if (!active) return;
                setProfile(p);
                setRole(r);
            } catch (error) {
                console.error("Failed to load profile/role", error);
                if (!active) return;
                setProfile(null);
                setRole(null);
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    const loading = authLoading || (isAuthenticated && (profile === undefined || role === undefined));

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user: profile,
            role,
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
