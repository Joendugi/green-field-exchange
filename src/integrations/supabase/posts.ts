import { supabase } from "./client";

export type PostInput = {
    content: string;
    image_url?: string;
    video_url?: string;
    type?: string;
    tags?: string[];
};

export async function createPost(input: PostInput) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("posts")
        .insert({
            user_id: userData.user.id,
            content: input.content,
            image_url: input.image_url,
            video_url: input.video_url,
            type: input.type || 'social',
            tags: input.tags || [],
        })
        .select("*, profiles:user_id(*)")
        .single();

    if (error) throw error;
    return data;
}

export async function getPosts() {
    const { data, error } = await supabase
        .from("posts")
        .select("*, profiles:user_id(*), post_likes(*), post_comments(*)")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function toggleLike(postId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Check if liked
    const { data: existingLike } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", userData.user.id)
        .single();

    if (existingLike) {
        await supabase
            .from("post_likes")
            .delete()
            .eq("id", existingLike.id);
        
        // Decrement count (normally handled by triggers, but for UI update speed we might do it here or rely on invalidate)
    } else {
        await supabase
            .from("post_likes")
            .insert({
                post_id: postId,
                user_id: userData.user.id,
            });
    }
}

export async function addComment(postId: string, content: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("post_comments")
        .insert({
            post_id: postId,
            user_id: userData.user.id,
            content,
        })
        .select("*, profiles:user_id(*)")
        .single();

    if (error) throw error;
    return data;
}

export async function getUserPosts(userId: string) {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from("posts")
        .select("*, profiles:user_id(*), post_likes(*), post_comments(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}
