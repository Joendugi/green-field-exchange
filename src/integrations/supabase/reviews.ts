import { supabase } from "./client";

export type ReviewInput = {
    order_id: string;
    farmer_id: string;
    rating: number;
    comment?: string;
};

export async function submitReview(input: ReviewInput) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("reviews")
        .insert({
            order_id: input.order_id,
            buyer_id: userData.user.id,
            farmer_id: input.farmer_id,
            rating: input.rating,
            comment: input.comment,
        })
        .select("*")
        .single();

    if (error) throw error;
    return data;
}

export async function getProductReviews(productId: string) {
    // This requires a join or order link
    const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles:buyer_id(full_name, avatar_url), orders!inner(product_id)")
        .eq("orders.product_id", productId);

    if (error) throw error;
    return data;
}
