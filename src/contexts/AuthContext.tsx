import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { account } from "@/lib/appwrite";
import { Models } from "appwrite";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const userData = await account.get();
            setUser(userData);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession("current");
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
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
