import { useState, useEffect } from "react";
import { Bell, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useNavigate } from "react-router-dom";

const DISMISS_KEY = "notif_banner_dismissed";

/**
 * A slim, dismissible banner shown once to authenticated users
 * whose browser notification permission is still "default" (never asked).
 * Dismissed state is persisted in localStorage so it never re-appears.
 */
export default function NotificationPermissionBanner() {
  const { isAuthenticated } = useAuth();
  const { isSupported, permission, requestPermission } = useBrowserNotifications();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isSupported) return;
    if (permission !== "default") return; // already answered
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Small delay so it doesn't flash on first render
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [isAuthenticated, isSupported, permission]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const handleEnable = async () => {
    setRequesting(true);
    const result = await requestPermission();
    setRequesting(false);
    if (result === "granted" || result === "denied") {
      dismiss();
    }
  };

  const goToSettings = () => {
    dismiss();
    navigate("/dashboard?tab=settings");
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]
        w-[calc(100vw-2rem)] max-w-lg
        flex items-start gap-3
        rounded-2xl border border-primary/20
        bg-card/95 backdrop-blur-md shadow-2xl
        px-4 py-3
        animate-in slide-in-from-bottom-4 fade-in duration-300
      "
    >
      {/* Icon */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Bell className="h-5 w-5 text-primary" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">
          Stay informed — enable notifications
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Get alerts for new messages, orders, and updates even when this tab is in the background.
        </p>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleEnable}
            disabled={requesting}
          >
            <Bell className="h-3.5 w-3.5" />
            {requesting ? "Requesting…" : "Enable Now"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-xs text-muted-foreground"
            onClick={goToSettings}
          >
            Settings
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        aria-label="Dismiss notification prompt"
        className="shrink-0 rounded-lg p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
