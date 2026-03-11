import { supabase } from "./client";

export type OrderRow = {
  id: string;
  buyer_id: string;
  farmer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  currency: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  escrow_status?: "pending" | "held" | "released" | "refunded";
  payment_type: "cash_on_delivery" | "mobile_money" | "bank_transfer" | "wallet";
  delivery_address: string;
  created_at: string;
  updated_at: string;
  // Joined fields from functions
  products_name?: string;
  products_image_url?: string;
  buyer_profiles_full_name?: string;
  farmer_profiles_full_name?: string;
};

export type OfferRow = {
  id: string;
  product_id: string;
  buyer_id: string;
  farmer_id: string;
  quantity: number;
  amount_per_unit: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  last_offered_by: string;
  message?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from functions
  products_name?: string;
  products_image_url?: string;
  buyer_profiles_full_name?: string;
  farmer_profiles_full_name?: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

// Orders
export async function createOrder(input: {
  product_id: string;
  quantity: number;
  delivery_address: string;
  payment_type?: "cash_on_delivery" | "mobile_money" | "bank_transfer" | "wallet";
}): Promise<OrderRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  // First fetch product to get price and farmer_id
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("price, farmer_id")
    .eq("id", input.product_id)
    .single();

  if (productError || !product) throw new Error("Product not found");

  const total_price = product.price * input.quantity;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: userId,
      farmer_id: product.farmer_id,
      product_id: input.product_id,
      quantity: input.quantity,
      total_price,
      payment_type: input.payment_type ?? "cash_on_delivery",
      delivery_address: input.delivery_address,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as OrderRow;
}

export async function getMyOrders(status?: string): Promise<OrderRow[]> {
  const { data, error } = await supabase.rpc("get_my_orders", {
    p_status: status ?? null,
  });

  if (error) throw error;
  return (data as OrderRow[]) ?? [];
}

export async function updateOrderStatus(id: string, status: OrderRow["status"]): Promise<OrderRow> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as OrderRow;
}

export async function cancelOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw error;
}

// Offers
export async function createOffer(input: {
  product_id: string;
  quantity: number;
  amount_per_unit: number;
  message?: string;
}): Promise<OfferRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  // Fetch product to get farmer_id
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("farmer_id")
    .eq("id", input.product_id)
    .single();

  if (productError || !product) throw new Error("Product not found");

  const { data, error } = await supabase
    .from("offers")
    .insert({
      product_id: input.product_id,
      buyer_id: userId,
      farmer_id: product.farmer_id,
      quantity: input.quantity,
      amount_per_unit: input.amount_per_unit,
      last_offered_by: userId,
      message: input.message,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as OfferRow;
}

export async function getMyOffers(status?: string): Promise<OfferRow[]> {
  const { data, error } = await supabase.rpc("get_my_offers", {
    p_status: status ?? null,
  });

  if (error) throw error;
  return (data as OfferRow[]) ?? [];
}

export async function updateOfferStatus(id: string, status: OfferRow["status"]): Promise<OfferRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("offers")
    .update({ status, last_offered_by: userId })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as OfferRow;
}

// Loyalty Discounts
export async function getMyLoyalDiscounts(): Promise<any[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("loyalty_discounts")
    .select("*")
    .eq("buyer_id", userId)
    .eq("is_active", true);

  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function setLoyaltyDiscount(farmer_id: string, buyer_id: string, discount_percentage: number, order_count_threshold: number): Promise<void> {
  const { error } = await supabase
    .from("loyalty_discounts")
    .upsert({
      farmer_id,
      buyer_id,
      discount_percentage,
      order_count_threshold,
      is_active: true,
    }, {
      onConflict: "farmer_id,buyer_id"
    });

  if (error) throw error;
}
