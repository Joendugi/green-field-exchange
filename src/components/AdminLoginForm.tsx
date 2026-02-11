import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";

interface AdminLoginFormProps {
  adminEmail: string;
  setAdminEmail: (email: string) => void;
  adminPassword: string;
  setAdminPassword: (password: string) => void;
  isAdminLoading: boolean;
  setIsAdminLoading: (loading: boolean) => void;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  adminEmail,
  setAdminEmail,
  adminPassword,
  setAdminPassword,
  isAdminLoading,
  setIsAdminLoading,
}) => {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  // We can't conditionally call hooks, so we always call this.
  // It will return false if not logged in or not admin.
  // However, immediately after login, this might not update instantly in the same render cycle
  // without some state management or reliance on the auth state change.
  // A better approach for "check after login" is to wait for auth state to settle.
  // For simplicity in this form, we'll successfuly sign in, then let the router/layout handle protection,
  // or we can try to fetch the role.

  // Since we are just logging in here, we will perform the sign in action.
  // The redirection to /admin will happen, and the /admin route should have a protection check.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);

    try {
      await signIn("password", { email: adminEmail, password: adminPassword, flow: "signIn" });

      // If signIn throws, we go to catch. If not, we assume success.
      // Redirect to admin. The Admin page should verify if the user is actually an admin.
      toast.success("Login successful. Verifying privileges...");
      navigate("/admin");
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Login failed";
      // Convex auth errors might be objects
      toast.error(typeof msg === 'string' ? msg : "Invalid credentials or login error");
    } finally {
      setIsAdminLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-email">Admin Email</Label>
        <Input
          id="admin-email"
          type="email"
          placeholder="admin@example.com"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isAdminLoading}>
        {isAdminLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Access Admin Console
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Admin access is restricted to approved staff members.
      </p>
    </form>
  );
};

export default AdminLoginForm;
