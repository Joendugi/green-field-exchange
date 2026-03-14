import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/contexts/AuthContext";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
if (!convexUrl) {
  console.error("Missing VITE_CONVEX_URL in environment variables.");
}
const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

function SupabaseAuthBridge({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const token = data.session?.access_token ?? null;
      convex.setAuth(async () => token);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token ?? null;
      convex.setAuth(async () => token);
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
