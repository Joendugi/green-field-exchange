import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCcw } from "lucide-react";

interface NetworkFallbackProps {
  onRetry?: () => void;
  message?: string;
}

/**
 * Shown when a page fails to load due to a network / Supabase timeout.
 * Gives the user a clear action (retry) instead of an infinite spinner.
 */
export function NetworkFallback({
  onRetry,
  message = "Unable to reach the server. Check your connection and try again.",
}: NetworkFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-6 bg-card p-8 rounded-3xl border border-border shadow-xl animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
            <WifiOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">You're offline</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>

        {/* Retry button */}
        <Button
          onClick={handleRetry}
          className="w-full h-11 rounded-2xl gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>

        {/* Tip */}
        <p className="text-xs text-muted-foreground">
          Tip: Switch to Wi-Fi or move to a stronger signal area for faster loading.
        </p>
      </div>
    </div>
  );
}
