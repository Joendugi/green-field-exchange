import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import GlobalNotifications from "@/components/GlobalNotifications";
import NotificationPermissionBanner from "@/components/NotificationPermissionBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkFallback } from "@/components/NetworkFallback";
import AIFloatingBubble from "@/components/AIFloatingBubble";

// Lazy load pages for code splitting
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Admin = lazy(() => import("@/pages/Admin"));
const Social = lazy(() => import("@/pages/Social"));
const AI = lazy(() => import("@/pages/AI"));
const Messages = lazy(() => import("@/pages/Messages"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const PasswordReset = lazy(() => import("@/pages/PasswordReset"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));
const MetaAds = lazy(() => import("@/pages/MetaAds"));
const Mission = lazy(() => import("@/pages/Mission"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Careers = lazy(() => import("@/pages/Careers"));
const FarmerStories = lazy(() => import("@/pages/FarmerStories"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const WalletPage = lazy(() => import("@/pages/Wallet"));

// Shared fallback for every lazy page — shown during chunk download
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" />
  </div>
);

// Per-page wrapper: catches render errors in individual pages without taking
// down the whole app, and shows a retry screen instead of a blank page.
function PageBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <GlobalNotifications />
      <NotificationPermissionBanner />

      {/* AIFloatingBubble is now outside <nav> so it doesn't load its hooks
          on every route before the page has mounted */}
      <AIFloatingBubble />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PageBoundary><Index /></PageBoundary>} />
        <Route path="/marketplace" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={
          loading
            ? <PageLoader />
            : (!isAuthenticated
                ? <PageBoundary><Auth /></PageBoundary>
                : <Navigate to="/dashboard" replace />)
        } />
        <Route path="/social" element={<PageBoundary><Social /></PageBoundary>} />
        <Route path="/about" element={<PageBoundary><About /></PageBoundary>} />
        <Route path="/mission" element={<PageBoundary><Mission /></PageBoundary>} />
        <Route path="/contact" element={<PageBoundary><Contact /></PageBoundary>} />
        <Route path="/careers" element={<PageBoundary><Careers /></PageBoundary>} />
        <Route path="/farmer-stories" element={<PageBoundary><FarmerStories /></PageBoundary>} />
        <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
        <Route path="/password-reset" element={<PageBoundary><PasswordReset /></PageBoundary>} />
        <Route path="/forgot-password" element={<PageBoundary><ForgotPassword /></PageBoundary>} />
        <Route path="/update-password" element={<PageBoundary><UpdatePassword /></PageBoundary>} />
        <Route path="/privacy" element={<PageBoundary><PrivacyPolicy /></PageBoundary>} />
        <Route path="/terms" element={<PageBoundary><TermsOfService /></PageBoundary>} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <PageBoundary><Dashboard /></PageBoundary>
          </ProtectedRoute>
        } />

        {/* Aliases for dashboard tabs for better UX/SEO */}
        <Route path="/profile" element={<Navigate to="/dashboard?tab=profile" replace />} />
        <Route path="/my-products" element={<Navigate to="/dashboard?tab=products" replace />} />
        <Route path="/orders" element={<Navigate to="/dashboard?tab=orders" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard?tab=settings" replace />} />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <PageBoundary><WalletPage /></PageBoundary>
          </ProtectedRoute>
        } />

        {/* More Protected Routes */}
        <Route path="/messages" element={
          <ProtectedRoute>
            <PageBoundary><Messages /></PageBoundary>
          </ProtectedRoute>
        } />
        <Route path="/ai" element={
          <ProtectedRoute>
            <PageBoundary><AI /></PageBoundary>
          </ProtectedRoute>
        } />
        <Route path="/users/:userId" element={<PageBoundary><UserProfile /></PageBoundary>} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <PageBoundary><Admin /></PageBoundary>
          </AdminRoute>
        } />
        <Route path="/meta-ads" element={
          <AdminRoute>
            <PageBoundary><MetaAds /></PageBoundary>
          </AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<PageBoundary><NotFound /></PageBoundary>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      {/* Top-level boundary catches any catastrophic error */}
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <AppContent />
          <Toaster position="top-right" richColors />
        </div>
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default App;
