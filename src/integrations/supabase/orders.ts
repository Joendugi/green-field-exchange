import { supabase } from "./client";

export type OrderInput = {
    product_id: string;
    quantity: number;
    delivery_address: string;
    payment_type?: string;
};

export async function createOrder(input: OrderInput) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated");

    // Fetch product to get farmer_id and price
    const { data: product, error: prodError } = await supabase
        .from("products")
        .select("farmer_id, price, currency")
        .eq("id", input.product_id)
        .single();

    if (prodError || !product) throw new Error("Product not found");

    const totalPrice = product.price * input.quantity;

    const { data, error } = await supabase
        .from("orders")
        .insert({
            buyer_id: userData.user.id,
            farmer_id: product.farmer_id,
            product_id: input.product_id,
            quantity: input.quantity,
            total_price: totalPrice,
            currency: product.currency === "USD" ? "USD" : (product.currency || "USD"),
            status: "pending",
            delivery_address: input.delivery_address,
            payment_type: input.payment_type || "cash_on_delivery",
        })
        .select("*")
        .single();

    if (error) throw error;
    return data;
}

export async function getMyOrders() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from("orders")
        .select("*, products:product_id(*)")
        .or(`buyer_id.eq.${userData.user.id},farmer_id.eq.${userData.user.id}`)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function payOrder(orderId: string) {
    const { data, error } = await supabase
        .from("orders")
        .update({ status: "paid" }) 
        .eq("id", orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function releasePayment(orderId: string) {
    const { data, error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function disputeOrder(orderId: string, reason: string) {
    const { data, error } = await supabase
        .from("orders")
        .update({ 
            status: "disputed",
            escrow_status: "held" 
        })
        .eq("id", orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getBuyerOrders() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from("orders")
        .select("*, products:product_id(*), farmer_id(full_name, avatar_url)")
        .eq("buyer_id", userData.user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function getFarmerOrders() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from("orders")
        .select("*, products:product_id(*), buyer_id(full_name, avatar_url)")
        .eq("farmer_id", userData.user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}
