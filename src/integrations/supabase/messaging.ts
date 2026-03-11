import { supabase } from "./client";

export type ConversationRow = {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message?: string;
  last_sender_id?: string;
  updated_at: string;
  // Joined fields from function
  other_user_id: string;
  other_user_full_name?: string;
  other_user_avatar_url?: string;
  unread_count: number;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined fields from function
  sender_full_name?: string;
  sender_avatar_url?: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

// Conversations
export async function getMyConversations(): Promise<ConversationRow[]> {
  const { data, error } = await supabase.rpc("get_my_conversations");

  if (error) throw error;
  return (data as ConversationRow[]) ?? [];
}

export async function findOrCreateConversation(other_user_id: string): Promise<string> {
  const { data, error } = await supabase.rpc("find_or_create_conversation", {
    p_other_user_id: other_user_id,
  });

  if (error) throw error;
  return data as string;
}

// Messages
export async function getConversationMessages(conversation_id: string): Promise<MessageRow[]> {
  const { data, error } = await supabase.rpc("get_conversation_messages", {
    p_conversation_id: conversation_id,
  });

  if (error) throw error;
  return (data as MessageRow[]) ?? [];
}

export async function sendMessage(conversation_id: string, content: string): Promise<string> {
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversation_id,
    p_content: content,
  });

  if (error) throw error;
  return data as string;
}

export async function markMessagesRead(conversation_id: string): Promise<void> {
  const { error } = await supabase.rpc("mark_messages_read", {
    p_conversation_id: conversation_id,
  });

  if (error) throw error;
}

// Real-time subscriptions
export function subscribeToConversation(conversation_id: string, callback: (payload: any) => void) {
  return supabase
    .channel(`conversation:${conversation_id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation_id}`
      },
      callback
    )
    .subscribe();
}

export function subscribeToConversations(callback: (payload: any) => void) {
  const userId = supabase.auth.getUser().then(({ data }) => data.user?.id);
  return supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      callback
    )
    .subscribe();
}
