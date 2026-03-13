import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Navbar from "@/components/Navbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

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
const MetaAds = lazy(() => import("@/pages/MetaAds"));
const Mission = lazy(() => import("@/pages/Mission"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" /></div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/marketplace" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/dashboard" replace />} />
          <Route path="/social" element={<Social />} />
          <Route path="/about" element={<About />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Aliases for dashboard tabs for better UX/SEO */}
          <Route path="/profile" element={<Navigate to="/dashboard?tab=profile" replace />} />
          <Route path="/my-products" element={<Navigate to="/dashboard?tab=products" replace />} />
          <Route path="/orders" element={<Navigate to="/dashboard?tab=orders" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard?tab=settings" replace />} />
          
          {/* More Protected Routes */}
          <Route path="/messages" element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/ai" element={
            <ProtectedRoute>
              <AI />
            </ProtectedRoute>
          } />
          <Route path="/users/:userId" element={<UserProfile />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
          <Route path="/meta-ads" element={
            <AdminRoute>
              <MetaAds />
            </AdminRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <AppContent />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
