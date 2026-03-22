import { supabase } from "./client";

export type ProductRow = {
  id: string;
  farmer_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  location: string;
  image_url: string | null;
  image_storage_path: string | null;
  is_available: boolean;
  is_hidden: boolean;
  is_featured: boolean;
  featured_until: string | null;
  expiry_date: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function listProducts(params: {
  category?: string;
  search?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<ProductRow[]> {
  const { data, error } = await supabase.rpc("list_products", {
    p_category: params.category || null,
    p_search: params.search || null,
    p_limit: params.limit || 40,
    p_cursor: params.cursor || null
  });

  if (error) {
    console.error("Supabase error in listProducts (RPC):", error);
    throw error;
  }
  
  // Since we need profiles, we still might need a follow-up or a better RPC.
  // For now, let's keep the join behavior by enriching the result manually if needed,
  // or updating the RPC to return profile data.
  // The current RPC doesn't return profiles, so we'll fetch them for the returned products.
  
  const products = (data as any[]) ?? [];
  if (products.length === 0) return [];

  const farmerIds = [...new Set(products.map(p => p.farmer_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, verified")
    .in("id", farmerIds);

  const profileMap = (profiles || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, any>);

  return products.map(p => ({
    ...p,
    profiles: profileMap[p.farmer_id]
  }));
}

export async function createProduct(input: {
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  location: string;
  image_url?: string | null;
  image_storage_path?: string | null;
  expiry_date?: string | null;
  currency?: string;
}): Promise<ProductRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("products")
    .insert({
      farmer_id: userId,
      name: input.name,
      description: input.description,
      price: input.price,
      quantity: input.quantity,
      unit: input.unit,
      category: input.category,
      location: input.location,
      image_url: input.image_url ?? null,
      image_storage_path: input.image_storage_path ?? null,
      expiry_date: input.expiry_date ?? null,
      currency: input.currency ?? "USD",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ProductRow;
}

export async function updateProduct(
  id: string,
  changes: Partial<
    Pick<
      ProductRow,
      | "name"
      | "description"
      | "price"
      | "quantity"
      | "unit"
      | "category"
      | "location"
      | "image_url"
      | "image_storage_path"
      | "is_available"
      | "is_hidden"
      | "is_featured"
      | "featured_until"
      | "expiry_date"
      | "currency"
    >
  >
): Promise<ProductRow> {
  const { data, error } = await supabase
    .from("products")
    .update(changes)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as ProductRow;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function getMyProducts(): Promise<ProductRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("farmer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProductRow[]) ?? [];
}

// Helper to enrich with farmer profile (join)
export async function listProductsWithProfiles(params: {
  category?: string;
  search?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<(ProductRow & { profiles?: { full_name: string | null; username: string | null } })[]> {
  const products = await listProducts(params);
  const farmerIds = [...new Set(products.map((p) => p.farmer_id))];

  if (farmerIds.length === 0) return products.map(p => ({ ...p }));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name,username")
    .in("id", farmerIds);

  const profileMap = (profiles ?? []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, any>);

  return products.map(p => ({
    ...p,
    profiles: profileMap[p.farmer_id],
  }));
}

export async function bulkUpdateProducts(
  ids: string[],
  changes: Partial<Pick<ProductRow, "price" | "quantity" | "is_available" | "location">>
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId || ids.length === 0) return;

  const { error } = await supabase
    .from("products")
    .update(changes)
    .in("id", ids)
    .eq("farmer_id", userId);

  if (error) throw error;
}

export async function predictPrice(params: { category: string, location: string }): Promise<{ suggested_price: number, confidence: string, reasoning?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('price-prediction', {
      body: params
    });

    if (error) throw error;
    
    return {
      suggested_price: data.suggested_price || 0,
      confidence: data.confidence || "Low",
      reasoning: data.reasoning
    };
  } catch (error) {
    console.error("Price prediction failed", error);
    // Local fallback for dev
    const basePrice = params.category === "vegetables" ? 5 : 10;
    const variation = Math.random() * 4;
    return {
      suggested_price: Number((basePrice + variation).toFixed(2)),
      confidence: "Low (Local Fallback)",
      reasoning: "The prediction service is temporarily unavailable. Using category averages."
    };
  }
}

export async function getSmartMatches(params: { limit?: number } = {}): Promise<any[]> {
    const limitAmount = params.limit || 4;
    return await listProductsWithProfiles({ limit: limitAmount });
}
