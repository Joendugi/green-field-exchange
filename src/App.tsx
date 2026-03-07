import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Social = lazy(() => import("./pages/Social"));
const AI = lazy(() => import("./pages/AI"));
const Messages = lazy(() => import("./pages/Messages"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const About = lazy(() => import("./pages/About"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Mission = lazy(() => import("./pages/Mission"));
const MissionVision = lazy(() => import("./pages/MissionVision"));
const Contact = lazy(() => import("./pages/Contact"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const FarmerStories = lazy(() => import("./pages/FarmerStories"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const GlobalTrade = lazy(() => import("./pages/GlobalTrade"));
const Careers = lazy(() => import("./pages/Careers"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));
const MetaAds = lazy(() => import("./pages/MetaAds"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./components/Profile"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={<Profile />} />
              <Route path="/social" element={<Social />} />
              <Route path="/ai" element={
                <ProtectedRoute>
                  <AI />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/about" element={<About />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/mission" element={<Mission />} />
              <Route path="/mission-vision" element={<MissionVision />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/farmer-stories" element={<FarmerStories />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/global-trade" element={<GlobalTrade />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/meta-ads" element={
                <AdminRoute>
                  <MetaAds />
                </AdminRoute>
              } />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
