import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { supabase } from "@/integrations/supabase/client";

type IdentityBridgeContextType = {
  supabaseUserId: string | null;
  convexUserId: string | null;
  isLoading: boolean;
  isConvexAuthReady: boolean;
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
  const [supabaseName, setSupabaseName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupabaseOnly = import.meta.env.MODE === "supabase-only";

  const provision = useMutation(api.users.provisionUser);

  // Fetch Convex user record linked to the Supabase user via email
  const convexUser = useQuery(
    api.users.getUserByEmail,
    !isSupabaseOnly && supabaseEmail ? { email: supabaseEmail } : "skip"
  );

  const [isConvexAuthReady, setIsConvexAuthReady] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);


  // Auto-provision user in Convex if they exist in Supabase but not Convex
  useEffect(() => {
    if (!isProvisioning && !isSupabaseOnly && supabaseUserId && supabaseEmail && convexUser === null && isConvexAuthReady) {
      setIsProvisioning(true);
      console.log("Provisioning user in Convex...", supabaseEmail);
      provision({ email: supabaseEmail, name: supabaseName || undefined })
        .catch(err => {
          console.error("Provisioning failed", err);
          setIsProvisioning(false);
        });
    }
  }, [supabaseUserId, supabaseEmail, convexUser, isConvexAuthReady, isSupabaseOnly, provision, supabaseName, isProvisioning]);

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
          // @ts-ignore - access convex via client
          const convex = (window as any).convex;
          if (convex) convex.setAuth(async () => null);
          setIsConvexAuthReady(true);
          return;
        }

        if (!active) return;
        setSupabaseUserId(session.user.id);
        setSupabaseEmail(session.user.email ?? null);
        setSupabaseName(session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? null);
        
        // Update Convex auth token
        // @ts-ignore
        const convex = (window as any).convex;
        if (convex) {
          const token = session.access_token;
          await convex.setAuth(async () => token);
          setIsConvexAuthReady(true);
        }
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

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const uid = session?.user?.id ?? null;
      setSupabaseUserId(uid);
      setSupabaseEmail(session?.user?.email ?? null);
      setSupabaseName(session?.user?.user_metadata?.full_name ?? session?.user?.user_metadata?.name ?? null);
      
      // @ts-ignore
      const convex = (window as any).convex;
      if (convex) {
        const token = session?.access_token ?? null;
        await convex.setAuth(async () => token);
        setIsConvexAuthReady(true);
      }
      
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: IdentityBridgeContextType & { isConvexAuthReady: boolean } = {
    supabaseUserId,
    convexUserId: convexUser?._id ?? null,
    isLoading: isLoading || (supabaseEmail && convexUser === undefined),
    isConvexAuthReady,
    error,
  };

  return (
    <IdentityBridgeContext.Provider value={value}>
      {children}
    </IdentityBridgeContext.Provider>
  );
};
