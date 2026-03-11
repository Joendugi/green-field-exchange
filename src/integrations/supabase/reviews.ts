import { supabase } from "./client";

export type ReviewRow = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  product_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  // Joined fields from functions
  reviewer_full_name?: string;
  reviewer_avatar_url?: string;
  product_name?: string;
  product_image_url?: string;
  reviewee_full_name?: string;
};

export type ProductRatingRow = {
  product_id: string;
  review_count: number;
  average_rating: number;
  reviews: ReviewRow[];
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

// Reviews
export async function getProductReviews(productId: string): Promise<ReviewRow[]> {
  const { data, error } = await supabase.rpc("get_product_reviews", {
    p_product_id: productId,
  });

  if (error) throw error;
  return (data as ReviewRow[]) ?? [];
}

export async function getMyReviews(given?: boolean): Promise<ReviewRow[]> {
  const { data, error } = await supabase.rpc("get_my_reviews", {
    p_given: given ?? null,
  });

  if (error) throw error;
  return (data as ReviewRow[]) ?? [];
}

export async function createOrUpdateReview(
  productId: string,
  revieweeId: string,
  rating: number,
  comment?: string
): Promise<string> {
  const { data, error } = await supabase.rpc("create_or_update_review", {
    p_product_id: productId,
    p_reviewee_id: revieweeId,
    p_rating: rating,
    p_comment: comment ?? null,
  });

  if (error) throw error;
  return data as string;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) throw error;
}

export async function getUserAverageRating(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_user_average_rating", {
    p_user_id: userId,
  });

  if (error) throw error;
  return (data as number) ?? 0;
}

// Product ratings (from materialized view)
export async function getProductRating(productId: string): Promise<ProductRatingRow | null> {
  const { data, error } = await supabase
    .from("product_ratings")
    .select("*")
    .eq("product_id", productId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return (data as ProductRatingRow) ?? null;
}

// Helper to check if user can review a product
export async function canReviewProduct(productId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  // Check if user has completed an order for this product
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", userId)
    .eq("product_id", productId)
    .eq("status", "completed")
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// Helper to get reviewee ID (product owner)
export async function getProductOwner(productId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("products")
    .select("farmer_id")
    .eq("id", productId)
    .single();

  if (error) throw error;
  return (data as any)?.farmer_id ?? null;
}
