import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/contexts/AuthContext";

// Supabase-only mode - no Convex dependency
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
