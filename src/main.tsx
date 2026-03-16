import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/contexts/AuthContext";
import { IdentityBridgeProvider } from "@/contexts/IdentityBridge";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
if (!convexUrl) {
  console.error("Missing VITE_CONVEX_URL in environment variables.");
}
const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

// Expose to window for IdentityBridge access
if (typeof window !== "undefined") {
  (window as any).convex = convex;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <IdentityBridgeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </IdentityBridgeProvider>
      </BrowserRouter>
    </ConvexProvider>
  </React.StrictMode>
);
