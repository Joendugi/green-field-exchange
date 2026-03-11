import { supabase } from "./client";

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type?: string;
  link?: string;
  metadata?: any;
  created_at: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

// Notifications
export async function getMyNotifications(unreadOnly = false, limit = 50): Promise<NotificationRow[]> {
  const { data, error } = await supabase.rpc("get_my_notifications", {
    p_unread_only: unreadOnly,
    p_limit: limit,
  });

  if (error) throw error;
  return (data as NotificationRow[]) ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data, error } = await supabase.rpc("get_unread_notification_count");

  if (error) throw error;
  return (data as number) ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data, error } = await supabase.rpc("mark_all_notifications_read");

  if (error) throw error;
  return (data as number) ?? 0;
}

// Service role functions (for backend use only)
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string,
  link?: string,
  metadata?: any
): Promise<string> {
  const { data, error } = await supabase.rpc("create_notification", {
    p_user_id: userId,
    p_title: title,
    p_message: message,
    p_type: type ?? null,
    p_link: link ?? null,
    p_metadata: metadata ?? null,
  });

  if (error) throw error;
  return data as string;
}

// Real-time subscription
export function subscribeToNotifications(callback: (payload: any) => void) {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
      },
      callback
    )
    .subscribe();
}
