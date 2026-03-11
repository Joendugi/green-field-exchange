import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { supabase } from "@/integrations/supabase/client";

type IdentityBridgeContextType = {
  supabaseUserId: string | null;
  convexUserId: string | null;
  isLoading: boolean;
  error: string | null;
};

const IdentityBridgeContext = createContext<IdentityBridgeContextType | null>(null);

export const useIdentityBridge = () => {
  const ctx = useContext(IdentityBridgeContext);
  if (!ctx) throw new Error("useIdentityBridge must be used within IdentityBridgeProvider");
  return ctx;
};

export const IdentityBridgeProvider = ({ children }: { children: ReactNode }) => {
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Convex user record linked to the Supabase user via email
  const convexUser = useQuery(
    api.users.getUserByEmail,
    supabaseEmail ? { email: supabaseEmail } : "skip"
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.user) {
          if (!active) return;
          setSupabaseUserId(null);
          setSupabaseEmail(null);
          return;
        }

        if (!active) return;
        setSupabaseUserId(session.user.id);
        setSupabaseEmail(session.user.email ?? null);
      } catch (e: any) {
        console.error("Identity bridge error", e);
        if (!active) return;
        setError(e.message);
        setSupabaseUserId(null);
        setSupabaseEmail(null);
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    };

    load();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSupabaseUserId(session?.user?.id ?? null);
      setSupabaseEmail(session?.user?.email ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: IdentityBridgeContextType = {
    supabaseUserId,
    convexUserId: convexUser?._id ?? null,
    isLoading: isLoading || (supabaseEmail && convexUser === undefined),
    error,
  };

  return (
    <IdentityBridgeContext.Provider value={value}>
      {children}
    </IdentityBridgeContext.Provider>
  );
};
