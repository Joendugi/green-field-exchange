import { createContext, useContext, ReactNode, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, getMyRole, ProfileRow } from "@/integrations/supabase/profiles";

interface AuthContextType {
    user: ProfileRow | null;
    role: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [profileLoaded, setProfileLoaded] = useState(false);

    // Guard flag: tracks whether the initial getSession() call has already
    // resolved so that the onAuthStateChange INITIAL_SESSION event does not
    // trigger a second profile load race condition on first mount.
    const sessionBootstrapped = useRef(false);

    useEffect(() => {
        let active = true;

        // ── Step 1: Read the cached session immediately (no network) ──────
        // getSession() resolves from localStorage synchronously on most
        // Supabase v2 setups, so this is effectively instant on mobile.
        void supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            sessionBootstrapped.current = true;
            setIsAuthenticated(Boolean(data.session));
            setAuthLoading(false);
        });

        // ── Step 2: Subscribe to future auth events (sign-in, sign-out…) ──
        // We skip the first INITIAL_SESSION event if getSession() already ran
        // to avoid double-loading the profile on cold start.
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            // If bootstrap hasn't finished yet let getSession() handle it
            if (!sessionBootstrapped.current && _event === "INITIAL_SESSION") return;
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
                setProfileLoaded(false);
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
            } finally {
                if (active) setProfileLoaded(true);
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, [isAuthenticated]);
    
    const refreshProfile = async () => {
        try {
            const [p, r] = await Promise.all([getMyProfile(), getMyRole()]);
            setProfile(p);
            setRole(r);
        } catch (error) {
            console.error("Failed to refresh profile", error);
        }
    };

    const loading = authLoading || (isAuthenticated && !profileLoaded);

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
            logout,
            refreshProfile
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
