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
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_hidden", false)
    .gt("quantity", 0)
    .or(`expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (params.category) {
    query = query.eq("category", params.category);
  }
  
  const { data, error } = await query.limit(params.limit || 40);

  if (error) {
    console.error("Supabase error in listProducts:", error);
    throw error;
  }
  
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

  const payload: any = {
    farmer_id: userId,
    name: input.name,
    description: input.description,
    price: input.price,
    quantity: input.quantity,
    unit: input.unit,
    category: input.category,
    location: input.location,
    image_url: input.image_url ?? null,
    expiry_date: input.expiry_date ?? null,
    currency: input.currency ?? "USD",
  };

  if (input.image_storage_path) {
    payload.image_storage_path = input.image_storage_path;
  }

  console.log("Supabase Insert Payload:", payload);

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Supabase createProduct Error:", error);
    throw error;
  }
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
