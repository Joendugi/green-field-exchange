import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";

interface UserSettingsState {
  notifications_enabled: boolean;
  notifications_orders: boolean;
  notifications_social: boolean;
  notifications_system: boolean;
  ai_assistant_enabled: boolean;
  dark_mode: boolean;
}

const defaultSettings: UserSettingsState = {
  notifications_enabled: true,
  notifications_orders: true,
  notifications_social: true,
  notifications_system: true,
  ai_assistant_enabled: true,
  dark_mode: false,
};

const Settings = () => {
  const [settings, setSettings] = useState<UserSettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

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
        const typedData = data as Partial<UserSettingsState>;
        setSettings({
          notifications_enabled: typedData.notifications_enabled ?? true,
          notifications_orders: typedData.notifications_orders ?? true,
          notifications_social: typedData.notifications_social ?? true,
          notifications_system: typedData.notifications_system ?? true,
          ai_assistant_enabled: typedData.ai_assistant_enabled ?? true,
          dark_mode: typedData.dark_mode ?? false,
        });
      } else {
        // Create default settings
        await supabase
          .from("user_settings")
          .upsert(
            {
              user_id: session.user.id,
              ...defaultSettings,
            },
            {
              onConflict: "user_id",
            }
          );
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettingsState, value: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const nextSettings = { ...settings, [key]: value };
      setSettings(nextSettings);

      const { error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: session.user.id,
            ...nextSettings,
          },
          {
            onConflict: "user_id",
          }
        );

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
          <div className={`rounded-xl border p-4 transition-colors ${settings.dark_mode ? "bg-slate-900 text-slate-100" : "bg-slate-50"}`}>
            <p className="text-sm font-semibold">Live preview</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className={`h-8 rounded-lg ${settings.dark_mode ? "bg-slate-800" : "bg-white"}`} />
              <div className="flex gap-2">
                <div className={`h-3 flex-1 rounded ${settings.dark_mode ? "bg-slate-700" : "bg-slate-200"}`} />
                <div className={`h-3 flex-1 rounded ${settings.dark_mode ? "bg-slate-700" : "bg-slate-200"}`} />
              </div>
              <p className="text-muted-foreground text-xs">
                {settings.dark_mode ? "Dark theme keeps things easy on the eyes." : "Light theme is bright and energetic."}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use the theme toggle in the navbar to switch appearance.
              </p>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              {settings.dark_mode ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch checked={settings.dark_mode} disabled aria-readonly aria-label="Dark mode status" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Orders</Label>
                <Switch
                  checked={settings.notifications_orders}
                  onCheckedChange={(checked) => updateSetting("notifications_orders", checked)}
                  disabled={!settings.notifications_enabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">Alerts for new orders and status changes.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Community</Label>
                <Switch
                  checked={settings.notifications_social}
                  onCheckedChange={(checked) => updateSetting("notifications_social", checked)}
                  disabled={!settings.notifications_enabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">Mentions, messages, and social activity.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>System</Label>
                <Switch
                  checked={settings.notifications_system}
                  onCheckedChange={(checked) => updateSetting("notifications_system", checked)}
                  disabled={!settings.notifications_enabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">Platform updates and important notices.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>Control AI-powered features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">AI Preview</p>
            <p className="text-muted-foreground">
              {settings.ai_assistant_enabled
                ? "You'll see smarter price suggestions, tailored recommendations, and quick insights."
                : "Turn the AI assistant back on to see helpful suggestions while you work."}
            </p>
          </div>
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
