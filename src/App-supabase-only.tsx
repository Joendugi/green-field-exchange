import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Navbar from "@/components/Navbar";
import AdminRoute from "@/components/AdminRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load pages
const Auth = lazy(() => import("@/pages/Auth"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const MyProducts = lazy(() => import("@/pages/MyProducts"));
const Orders = lazy(() => import("@/pages/Orders"));
const Messages = lazy(() => import("@/pages/Messages"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Profile = lazy(() => import("@/pages/Profile"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const Admin = lazy(() => import("@/pages/Admin"));
const Settings = lazy(() => import("@/pages/Settings"));
const SocialFeed = lazy(() => import("@/pages/SocialFeed"));
const PostDetail = lazy(() => import("@/pages/PostDetail"));
const PasswordReset = lazy(() => import("@/pages/PasswordReset"));

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Marketplace />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/my-products" element={isAuthenticated ? <MyProducts /> : <Auth />} />
            <Route path="/orders" element={isAuthenticated ? <Orders /> : <Auth />} />
            <Route path="/messages" element={isAuthenticated ? <Messages /> : <Auth />} />
            <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Auth />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Auth />} />
            <Route path="/users/:userId" element={<UserProfile />} />
            <Route path="/social" element={isAuthenticated ? <SocialFeed /> : <Auth />} />
            <Route path="/social/:postId" element={isAuthenticated ? <PostDetail /> : <Auth />} />
            <Route path="/settings" element={isAuthenticated ? <Settings /> : <Auth />} />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="*" element={<Marketplace />} />
          </Routes>
        </Suspense>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
