import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Moon, Sun, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const settings = useQuery(api.users.getSettings);
  const updateSettingsMutation = useMutation(api.users.updateSettings);

  const updateSetting = async (key: string, value: boolean) => {
    try {
      await updateSettingsMutation({ [key]: value });
      toast.success("Setting updated!");
    } catch (error: any) {
      toast.error("Failed to update setting");
    }
  };

  if (settings === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings && isAuthenticated) {
    // Settings don't exist yet, mutation will create them on first update or we can trigger it
    return (
      <div className="text-center py-12">
        <Button onClick={() => updateSetting("notifications_enabled", true)}>
          Initialize Settings
        </Button>
      </div>
    );
  }

  const currentSettings = settings || {
    notifications_enabled: true,
    notifications_orders: true,
    notifications_social: true,
    notifications_system: true,
    ai_assistant_enabled: true,
    dark_mode: false,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of your app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-xl border p-4 transition-colors ${currentSettings.dark_mode ? "bg-slate-900 text-slate-100" : "bg-slate-50"}`}>
            <p className="text-sm font-semibold">Live preview</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className={`h-8 rounded-lg ${currentSettings.dark_mode ? "bg-slate-800" : "bg-white"}`} />
              <div className="flex gap-2">
                <div className={`h-3 flex-1 rounded ${currentSettings.dark_mode ? "bg-slate-700" : "bg-slate-200"}`} />
                <div className={`h-3 flex-1 rounded ${currentSettings.dark_mode ? "bg-slate-700" : "bg-slate-200"}`} />
              </div>
              <p className="text-muted-foreground text-xs">
                {currentSettings.dark_mode ? "Dark theme keeps things easy on the eyes." : "Light theme is bright and energetic."}
              </p>
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
              checked={currentSettings.notifications_enabled}
              onCheckedChange={(checked) => updateSetting("notifications_enabled", checked)}
            />
          </div>
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Orders</Label>
                <Switch
                  checked={currentSettings.notifications_orders}
                  onCheckedChange={(checked) => updateSetting("notifications_orders", checked)}
                  disabled={!currentSettings.notifications_enabled}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Community</Label>
                <Switch
                  checked={currentSettings.notifications_social}
                  onCheckedChange={(checked) => updateSetting("notifications_social", checked)}
                  disabled={!currentSettings.notifications_enabled}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>System</Label>
                <Switch
                  checked={currentSettings.notifications_system}
                  onCheckedChange={(checked) => updateSetting("notifications_system", checked)}
                  disabled={!currentSettings.notifications_enabled}
                />
              </div>
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered recommendations and price predictions
              </p>
            </div>
            <Switch
              checked={currentSettings.ai_assistant_enabled}
              onCheckedChange={(checked) => updateSetting("ai_assistant_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
