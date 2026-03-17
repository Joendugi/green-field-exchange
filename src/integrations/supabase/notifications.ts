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
  user_id: string;
};

// Notifications
export async function getMyNotifications(unreadOnly = false, limit = 50): Promise<NotificationRow[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as NotificationRow[]) ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return 0;

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string,
  link?: string,
  metadata?: any
): Promise<string> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type: type ?? null,
      link: link ?? null,
      metadata: metadata ?? null,
      is_read: false
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}
