import { supabase } from "./client";

export async function getConversations() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from("conversations")
        .select(`
            *,
            p1:participant1_id(id, full_name, avatar_url, username),
            p2:participant2_id(id, full_name, avatar_url, username)
        `)
        .or(`participant1_id.eq.${userData.user.id},participant2_id.eq.${userData.user.id}`)
        .order("updated_at", { ascending: false });

    if (error) throw error;
    
    return (data || []).map(convo => {
        const otherUser = convo.participant1_id === userData.user?.id ? convo.p2 : convo.p1;
        return {
            ...convo,
            otherUser
        };
    });
}

export async function getMessages(conversationId: string) {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
}

export async function sendMessage(conversationId: string, content: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: userData.user.id,
            content
        })
        .select()
        .single();

    if (error) throw error;

    // Update conversation last message
    await supabase
        .from("conversations")
        .update({
            last_message: content,
            last_sender_id: userData.user.id,
            updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);

    return data;
}

export async function markAsRead(conversationId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userData.user.id)
        .eq("is_read", false);
}

export async function startConversation(otherUserId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Check if exists
    const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant1_id.eq.${userData.user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${userData.user.id})`)
        .single();

    if (existing) return existing.id;

    const { data, error } = await supabase
        .from("conversations")
        .insert({
            participant1_id: userData.user.id,
            participant2_id: otherUserId
        })
        .select()
        .single();

    if (error) throw error;
    return data.id;
}

export async function searchUsers(query: string) {
    if (!query) return [];
    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);

    if (error) throw error;
    return data;
}

export async function getUnreadMessagesCount() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 0;

    // Get all conversations for the user
    const { data: convos, error: convoError } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant1_id.eq.${userData.user.id},participant2_id.eq.${userData.user.id}`);

    if (convoError || !convos || convos.length === 0) return 0;

    const convoIds = convos.map(c => c.id);

    // Count unread messages in these conversations that were not sent by the current user
    const { count, error } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .in("conversation_id", convoIds)
        .eq("is_read", false)
        .neq("sender_id", userData.user.id);

    if (error) throw error;
    return count || 0;
}
