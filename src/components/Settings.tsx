import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    ai_assistant_enabled: true,
    dark_mode: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Apply dark mode
    if (settings.dark_mode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.dark_mode]);

  const fetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          notifications_enabled: data.notifications_enabled,
          ai_assistant_enabled: data.ai_assistant_enabled,
          dark_mode: data.dark_mode,
        });
      } else {
        // Create default settings
        await supabase.from("user_settings").insert({
          user_id: session.user.id,
          notifications_enabled: true,
          ai_assistant_enabled: true,
          dark_mode: false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setSettings({ ...settings, [key]: value });

      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: session.user.id,
          [key]: value,
        });

      if (error) throw error;
      toast.success("Setting updated!");
    } catch (error: any) {
      toast.error("Failed to update setting");
      setSettings({ ...settings, [key]: !value });
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of your app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark theme
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings.dark_mode ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={settings.dark_mode}
                onCheckedChange={(checked) => updateSetting("dark_mode", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about orders, messages, and updates
              </p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => updateSetting("notifications_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>Control AI-powered features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered recommendations and price predictions
              </p>
            </div>
            <Switch
              checked={settings.ai_assistant_enabled}
              onCheckedChange={(checked) => updateSetting("ai_assistant_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
