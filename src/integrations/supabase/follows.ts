import { supabase } from "./client";

export async function followUser(targetUserId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("user_follows") // Assuming this table exists or I'll add it
        .insert({
            follower_id: userData.user.id,
            following_id: targetUserId,
        });

    if (error) throw error;
    return data;
}

export async function unfollowUser(targetUserId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", userData.user.id)
        .eq("following_id", targetUserId);

    if (error) throw error;
}

export async function getFollowing() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userData.user.id);

    if (error) return [];
    return data.map(f => f.following_id);
}

export async function getCounts(userId: string) {
    if (!userId) return { followers: 0, following: 0 };
    
    const [followersResponse, followingResponse] = await Promise.all([
        supabase.from("user_follows").select("*", { count: 'exact', head: true }).eq("following_id", userId),
        supabase.from("user_follows").select("*", { count: 'exact', head: true }).eq("follower_id", userId)
    ]);

    return {
        followers: followersResponse.count || 0,
        following: followingResponse.count || 0
    };
}

export async function getFollowers(userId: string) {
    if (!userId) return [];
    const { data, error } = await supabase
        .from("user_follows")
        .select(`
            follower_id,
            profiles!user_follows_follower_id_fkey(username, full_name, avatar_url)
        `)
        .eq("following_id", userId)
        .order("created_at", { ascending: false });
        
    if (error) throw error;
    return data || [];
}

export async function isFollowing(followingId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !followingId) return false;

    const { data, error } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", userData.user.id)
        .eq("following_id", followingId)
        .maybeSingle();
        
    if (error || !data) return false;
    return true;
}
