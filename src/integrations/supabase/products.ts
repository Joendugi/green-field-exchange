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
    p_category: params.category ?? null,
    p_search: params.search ?? null,
    p_limit: params.limit ?? 40,
    p_cursor: params.cursor ?? null,
  });

  if (error) throw error;
  return (data as ProductRow[]) ?? [];
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
