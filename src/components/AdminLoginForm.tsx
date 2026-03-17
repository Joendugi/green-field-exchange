import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) throw error;

      toast.success("Login successful. Verifying privileges...");
      navigate("/admin");
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Login failed";
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
