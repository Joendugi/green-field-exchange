import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/contexts/AuthContext";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function SupabaseAuthBridge({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      convex.setAuth(data.session?.access_token ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      convex.setAuth(session?.access_token ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <SupabaseAuthBridge>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SupabaseAuthBridge>
    </ConvexProvider>
  </React.StrictMode>
);
