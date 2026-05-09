import { useState, useCallback, useEffect } from "react";

export type NotificationPermission = "default" | "granted" | "denied" | "unsupported";

export interface BrowserNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  /** Milliseconds before the notification auto-closes (not supported on all platforms) */
  autoCloseMs?: number;
  onClick?: () => void;
}

const ICON_URL = "/favicon.png";
const BADGE_URL = "/favicon.png";

/**
 * Hook that wraps the browser Web Notification API.
 *
 * Usage:
 *   const { permission, requestPermission, sendNotification, isSupported } = useBrowserNotifications();
 */
export function useBrowserNotifications() {
  const isSupported =
    typeof window !== "undefined" && "Notification" in window;

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!isSupported) return "unsupported";
    return (Notification.permission as NotificationPermission) ?? "default";
  });

  // Keep state in sync if the user changes permission in browser settings externally
  useEffect(() => {
    if (!isSupported) return;
    const interval = setInterval(() => {
      const current = Notification.permission as NotificationPermission;
      setPermission((prev) => (prev !== current ? current : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return "unsupported";
    if (permission === "granted") return "granted";

    try {
      const result = await Notification.requestPermission();
      const mapped = result as NotificationPermission;
      setPermission(mapped);
      return mapped;
    } catch {
      return "denied";
    }
  }, [isSupported, permission]);

  const sendNotification = useCallback(
    (title: string, options: BrowserNotificationOptions = {}) => {
      if (!isSupported || permission !== "granted") return null;

      const { autoCloseMs, onClick, ...rest } = options;

      const n = new Notification(title, {
        icon: rest.icon ?? ICON_URL,
        badge: rest.badge ?? BADGE_URL,
        body: rest.body,
        tag: rest.tag,
      });

      if (onClick) {
        n.onclick = (e) => {
          e.preventDefault();
          window.focus();
          onClick();
          n.close();
        };
      }

      if (autoCloseMs && autoCloseMs > 0) {
        setTimeout(() => n.close(), autoCloseMs);
      }

      return n;
    },
    [isSupported, permission]
  );

  return { isSupported, permission, requestPermission, sendNotification };
}
