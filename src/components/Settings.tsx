import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

const DEFAULT_SETTINGS = {
  notifications_enabled: true,
  notifications_orders: true,
  notifications_social: true,
  notifications_system: true,
  ai_assistant_enabled: true,
  dark_mode: false,
};

/* ── Permission status pill ──────────────────────────────────────────────── */
function PermissionBadge({ permission }: { permission: string }) {
  if (permission === "granted") {
    return (
      <Badge className="gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Allowed
      </Badge>
    );
  }
  if (permission === "denied") {
    return (
      <Badge className="gap-1.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0">
        <XCircle className="h-3.5 w-3.5" />
        Blocked
      </Badge>
    );
  }
  if (permission === "unsupported") {
    return (
      <Badge className="gap-1.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0">
        <AlertCircle className="h-3.5 w-3.5" />
        Not supported
      </Badge>
    );
  }
  return (
    <Badge className="gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0">
      <AlertCircle className="h-3.5 w-3.5" />
      Not yet enabled
    </Badge>
  );
}

/* ── Main Settings component ─────────────────────────────────────────────── */
const Settings = () => {
  const { isAuthenticated } = useAuth();
  const { isSupported, permission, requestPermission, sendNotification } =
    useBrowserNotifications();

  const [currentSettings, setCurrentSettings] = useState<
    typeof DEFAULT_SETTINGS | undefined
  >(undefined);
  const [requestingPermission, setRequestingPermission] = useState(false);

  /* Load preferences from localStorage */
  useEffect(() => {
    const stored = localStorage.getItem("user_settings");
    if (stored) {
      try {
        setCurrentSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        setCurrentSettings(DEFAULT_SETTINGS);
      }
    } else {
      setCurrentSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    if (!currentSettings) return;
    const newSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(newSettings);
    localStorage.setItem("user_settings", JSON.stringify(newSettings));

    if (key === "dark_mode") {
      localStorage.setItem("theme", value ? "dark" : "light");
      window.dispatchEvent(
        new CustomEvent("theme-change", { detail: { darkMode: value } })
      );
      if (value) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }

    toast.success("Setting updated");
  };

  /* Request browser notification permission */
  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    const result = await requestPermission();
    setRequestingPermission(false);

    if (result === "granted") {
      toast.success("Browser notifications enabled!", {
        description: "You'll receive alerts even when this tab is in the background.",
      });
    } else if (result === "denied") {
      toast.error("Notifications blocked", {
        description:
          "You've blocked notifications in your browser. Open your browser's site settings to re-enable them.",
        duration: 8000,
      });
    }
  };

  /* Send a live test notification */
  const handleTestNotification = () => {
    sendNotification("🌾 Test Notification", {
      body: "Browser notifications are working! You'll get alerts for new messages and orders.",
      tag: "test-notification",
      autoCloseMs: 6000,
    });
    toast.success("Test notification sent! Check your browser.");
  };

  /* ── Loading skeleton ─────────────────────────────────────────────────── */
  if (currentSettings === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold">Settings</h2>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`rounded-xl border p-4 transition-colors ${
              currentSettings.dark_mode
                ? "bg-slate-900 text-slate-100"
                : "bg-slate-50"
            }`}
          >
            <p className="text-sm font-semibold">Live preview</p>
            <div className="mt-3 space-y-2 text-xs">
              <div
                className={`h-8 rounded-lg ${
                  currentSettings.dark_mode ? "bg-slate-800" : "bg-white"
                }`}
              />
              <div className="flex gap-2">
                <div
                  className={`h-3 flex-1 rounded ${
                    currentSettings.dark_mode ? "bg-slate-700" : "bg-slate-200"
                  }`}
                />
                <div
                  className={`h-3 flex-1 rounded ${
                    currentSettings.dark_mode ? "bg-slate-700" : "bg-slate-200"
                  }`}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {currentSettings.dark_mode
                  ? "Dark theme keeps things easy on the eyes."
                  : "Light theme is bright and energetic."}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark theme
              </p>
            </div>
            <Switch
              id="dark-mode-toggle"
              checked={currentSettings.dark_mode}
              onCheckedChange={(checked) => updateSetting("dark_mode", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Browser (Push) Notifications ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Browser Notifications
              </CardTitle>
              <CardDescription className="mt-1">
                Get real-time alerts even when you're on a different tab or your
                browser is minimised.
              </CardDescription>
            </div>
            <PermissionBadge permission={permission} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* What you'll be notified about */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              You'll be notified about:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                New messages from buyers or farmers
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                New orders placed on your listings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Order status and payment updates
              </li>
            </ul>
          </div>

          {/* Unsupported browser */}
          {!isSupported && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  Not supported in this browser
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                  Try Chrome, Firefox, or Edge for browser notification support.
                </p>
              </div>
            </div>
          )}

          {/* Denied state — guide the user to fix it */}
          {isSupported && permission === "denied" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-300">
                  Notifications are blocked
                </p>
                <p className="text-red-700 dark:text-red-400 mt-0.5">
                  To re-enable: click the lock / info icon in your browser's
                  address bar → <strong>Notifications</strong> → set to{" "}
                  <strong>Allow</strong>, then refresh the page.
                </p>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          {isSupported && (
            <div className="flex flex-wrap gap-3">
              {permission !== "granted" && permission !== "denied" && (
                <Button
                  onClick={handleRequestPermission}
                  disabled={requestingPermission}
                  className="gap-2"
                >
                  {requestingPermission ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  Enable Browser Notifications
                </Button>
              )}

              {permission === "granted" && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleTestNotification}
                    className="gap-2"
                  >
                    <BellRing className="h-4 w-4" />
                    Send Test Notification
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
                    onClick={() =>
                      toast.info(
                        "To disable: click the lock icon in your browser address bar → Notifications → Block."
                      )
                    }
                  >
                    <BellOff className="h-4 w-4" />
                    Disable
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── In-app Notification Preferences ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Manage which in-app toast notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-enabled">Enable In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive toast alerts about orders, messages, and updates
              </p>
            </div>
            <Switch
              id="notif-enabled"
              checked={currentSettings.notifications_enabled}
              onCheckedChange={(checked) =>
                updateSetting("notifications_enabled", checked)
              }
            />
          </div>
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="notif-orders">Orders</Label>
                <Switch
                  id="notif-orders"
                  checked={currentSettings.notifications_orders}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications_orders", checked)
                  }
                  disabled={!currentSettings.notifications_enabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                New orders &amp; status changes
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="notif-social">Community</Label>
                <Switch
                  id="notif-social"
                  checked={currentSettings.notifications_social}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications_social", checked)
                  }
                  disabled={!currentSettings.notifications_enabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Likes, comments &amp; follows
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="notif-system">System</Label>
                <Switch
                  id="notif-system"
                  checked={currentSettings.notifications_system}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications_system", checked)
                  }
                  disabled={!currentSettings.notifications_enabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Platform announcements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── AI Features ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>Control AI-powered features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-toggle">AI Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered recommendations and price predictions
              </p>
            </div>
            <Switch
              id="ai-toggle"
              checked={currentSettings.ai_assistant_enabled}
              onCheckedChange={(checked) =>
                updateSetting("ai_assistant_enabled", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
