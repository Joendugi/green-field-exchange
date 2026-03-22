import { supabase } from "./client";

export type OfferInput = {
    product_id: string;
    quantity: number;
    amount_per_unit: number;
    message?: string;
};

export async function createOffer(input: OfferInput) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated");

    // Fetch product to get farmer_id
    const { data: product, error: prodError } = await supabase
        .from("products")
        .select("farmer_id")
        .eq("id", input.product_id)
        .single();

    if (prodError || !product) throw new Error("Product not found");

    const { data, error } = await supabase
        .from("offers")
        .insert({
            product_id: input.product_id,
            buyer_id: userData.user.id,
            farmer_id: product.farmer_id,
            quantity: input.quantity,
            amount_per_unit: input.amount_per_unit,
            status: "pending",
            last_offered_by: userData.user.id,
            message: input.message,
        })
        .select("*")
        .single();

    if (error) throw error;
    return data;
}

export async function getMyOffers() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from("offers")
        .select("*, products(*)")
        .or(`buyer_id.eq.${userData.user.id},farmer_id.eq.${userData.user.id}`)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function respondOffer(input: { offerId: string; status: string; amount_per_unit?: number; message?: string }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const updateData: any = {
        status: input.status,
        last_offered_by: userData.user.id,
    };

    if (input.amount_per_unit !== undefined) {
        updateData.amount_per_unit = input.amount_per_unit;
    }

    if (input.message !== undefined) {
        updateData.message = input.message;
    }

    const { data, error } = await supabase
        .from("offers")
        .update(updateData)
        .eq("id", input.offerId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function finalizeCheckout(input: { offerId: string; delivery_address: string }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("*, products(price, currency)")
        .eq("id", input.offerId)
        .single();

    if (offerError || !offer) throw new Error("Offer not found");

    if (offer.status !== "accepted") {
        throw new Error("Offer must be accepted before checkout");
    }

    // Create an order
    const totalPrice = offer.amount_per_unit * offer.quantity;
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
            buyer_id: userData.user.id,
            farmer_id: offer.farmer_id,
            product_id: offer.product_id,
            quantity: offer.quantity,
            total_price: totalPrice,
            currency: (offer.products as any)?.currency === "USD" ? "USD" : ((offer.products as any)?.currency || "USD"),
            status: "pending",
            delivery_address: input.delivery_address,
            payment_type: "cash_on_delivery",
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // Mark offer as completed
    await respondOffer({ offerId: input.offerId, status: "completed" });

    return order;
}
