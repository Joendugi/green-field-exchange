import { supabase } from "./client";

// Helper function to fetch user profiles for posts
async function fetchUserProfiles(posts: any[]) {
    const userIds = [...new Set(posts.map(post => post.user_id).filter(id => id && typeof id === 'string'))];
    
    if (userIds.length === 0) return posts;
    
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, verified, location")
        .in("id", userIds);
    
    if (error) {
        console.error("Error fetching profiles:", error);
        return posts;
    }
    
    const profileMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
    }, {} as Record<string, any>);
    
    return posts.map(post => {
        const profile = profileMap[post.user_id];
        return {
            ...post,
            // Keep original UUID for ID comparisons (e.g. post.user_id_raw !== currentUser.id)
            user_id_raw: post.user_id,
            // Replace user_id with profile object so UI can access .full_name, .avatar_url, etc.
            user_id: profile || { id: post.user_id },
        };
    });
}

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
        .select("*")
        .single();

    if (error) {
        console.error("Error in createPost:", error);
        throw error;
    }
    return data;
}

export async function getPosts() {
    const { data, error } = await supabase
        .from("posts")
        .select("*, post_likes(*), post_comments(*, profiles(*)), post_reposts(*)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error in getPosts:", error);
        throw error;
    }
    
    // Fetch user profiles separately for the main post
    return await fetchUserProfiles(data || []);
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
        .maybeSingle();

    if (existingLike) {
        await supabase
            .from("post_likes")
            .delete()
            .eq("id", existingLike.id);
    } else {
        await supabase
            .from("post_likes")
            .insert({
                post_id: postId,
                user_id: userData.user.id,
            });
    }
}

export async function toggleRepost(postId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Check if reposted
    const { data: existingRepost } = await supabase
        .from("post_reposts")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

    if (existingRepost) {
        await supabase
            .from("post_reposts")
            .delete()
            .eq("id", existingRepost.id);
    } else {
        await supabase
            .from("post_reposts")
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
        .select("*, profiles(*)")
        .single();

    if (error) {
        console.error("Error in addComment:", error);
        throw error;
    }
    return data;
}

export async function toggleCommentSolution(commentId: string, isSolution: boolean) {
    const { error } = await supabase
        .from("post_comments")
        .update({ is_solution: isSolution })
        .eq("id", commentId);

    if (error) {
        console.error("Error in toggleCommentSolution:", error);
        throw error;
    }
}

export async function getUserPosts(userId: string) {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from("posts")
        .select("*, post_likes(*), post_comments(*, profiles(*)), post_reposts(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error in getUserPosts:", error);
        throw error;
    }
    
    // Fetch user profiles separately
    return await fetchUserProfiles(data || []);
}
// Stories
export async function getFeaturedStories() {
    const { data, error } = await supabase
        .from("posts")
        .select("*, post_likes(*), post_comments(*, profiles(*)), post_reposts(*)")
        .eq("is_featured", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error in getFeaturedStories:", error);
        throw error;
    }
    
    // Fetch user profiles separately
    return await fetchUserProfiles(data || []);
}

// Admin actions
export async function updatePostFeaturedStatus(postId: string, isFeatured: boolean) {
    const { data, error } = await supabase
        .from("posts")
        .update({ is_featured: isFeatured })
        .eq("id", postId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
