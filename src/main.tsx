import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { HelmetProvider } from "react-helmet-async";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes — data is considered fresh
      // gcTime (was cacheTime): keep cached data for 10 min after unmount.
      // Without this, returning to the app after 5+ min in the background
      // triggers simultaneous re-fetches for ALL previously visited pages.
      gcTime: 1000 * 60 * 10,
      // Don't fire queries when the device is offline — prevents a flood of
      // failed network requests on app resume with no connection.
      networkMode: "offlineFirst",
      // Show the last known data while re-fetching in the background
      // instead of showing a loading spinner every time.
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <WalletProvider>
              <App />
            </WalletProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
