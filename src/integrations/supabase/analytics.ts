import { supabase } from "./client";

export async function getFarmerAnalytics(farmerId: string) {
    if (!farmerId) return null;

    // 1. Revenue Analytics
    const { data: orders } = await supabase
        .from("orders")
        .select(`
            *,
            product:product_id(id, name, price, category, location, quantity, unit)
        `)
        .eq("farmer_id", farmerId);

    const safeOrders = orders || [];
    const completedOrders = safeOrders.filter(o => o.status === "completed" || o.escrow_status === "released");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    const totalOrders = safeOrders.length;

    // 2. Product Performance
    const productStats: Record<string, { revenue: number, count: number, name: string }> = {};
    for (const order of completedOrders) {
        if (!order.product) continue;
        const prod = Array.isArray(order.product) ? order.product[0] : order.product;
        if (!prod) continue;
        const prodId = prod.id;
        
        if (!productStats[prodId]) {
            productStats[prodId] = { revenue: 0, count: 0, name: prod.name || "Unknown Product" };
        }
        productStats[prodId].revenue += Number(order.total_price);
        productStats[prodId].count += 1;
    }
    const productPerformance = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

    // 3. Market Trends (Mock for now or use real search logs if we populate them)
    const { data: searchLogs } = await supabase
        .from("search_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

    const categoryDemand: Record<string, number> = {};
    const locationDemand: Record<string, number> = {};

    (searchLogs || []).forEach(log => {
        if (log.category && log.category !== "all") {
            categoryDemand[log.category] = (categoryDemand[log.category] || 0) + 1;
        }
        if (log.location) {
            const loc = log.location.toLowerCase().trim();
            locationDemand[loc] = (locationDemand[loc] || 0) + 1;
        }
    });

    const marketTrends = {
        categories: Object.entries(categoryDemand).sort((a, b) => b[1] - a[1]).slice(0, 5),
        locations: Object.entries(locationDemand).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };

    // If empty due to no logs, provide fallback defaults for UI
    if (marketTrends.categories.length === 0) {
        marketTrends.categories = [["vegetables", 15], ["fruits", 12], ["grains", 8]];
    }
    if (marketTrends.locations.length === 0) {
        marketTrends.locations = [["nairobi", 20], ["mombasa", 10], ["kisumu", 5]];
    }

    // 4. Regional Price Benchmarks
    const { data: farmerProducts } = await supabase
        .from("products")
        .select("*")
        .eq("farmer_id", farmerId);

    const benchmarks: Array<{
        productId: string,
        productName: string,
        category: string,
        location: string,
        yourPrice: number,
        marketAverage: number,
        diffPercentage: number
    }> = [];

    if (farmerProducts && farmerProducts.length > 0) {
        for (const product of farmerProducts) {
            const { data: similarProducts } = await supabase
                .from("products")
                .select("price")
                .eq("category", product.category)
                .eq("location", product.location);

            if (similarProducts && similarProducts.length > 0) {
                const avg = similarProducts.reduce((sum, p) => sum + Number(p.price), 0) / similarProducts.length;
                benchmarks.push({
                    productId: product.id,
                    productName: product.name,
                    category: product.category,
                    location: product.location,
                    yourPrice: Number(product.price),
                    marketAverage: avg,
                    diffPercentage: ((Number(product.price) - avg) / (avg || 1)) * 100
                });
            }
        }
    }

    // 5. Customer Loyalty
    const buyerStats: Record<string, { count: number, spent: number }> = {};
    for (const order of completedOrders) {
        const bId = order.buyer_id;
        if (!buyerStats[bId]) buyerStats[bId] = { count: 0, spent: 0 };
        buyerStats[bId].count += 1;
        buyerStats[bId].spent += Number(order.total_price);
    }

    const topBuyers = Object.entries(buyerStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

    const customerLoyalty = await Promise.all(
        topBuyers.map(async ([buyerId, stats]) => {
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, username, avatar_url")
                .eq("id", buyerId)
                .single();

            const { data: reward } = await supabase
                .from("loyalty_discounts")
                .select("is_active")
                .eq("farmer_id", farmerId)
                .eq("buyer_id", buyerId)
                .single();

            return {
                buyerId,
                name: profile?.full_name || profile?.username || "Valued Buyer",
                avatar: profile?.avatar_url,
                isRewarded: reward?.is_active || false,
                ...stats
            };
        })
    );

    // 6. Seasonal Forecast (simplified mock)
    const now = new Date();
    const seasonalForecast = [
        {
            month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(now.getFullYear(), (now.getMonth() + 1) % 12, 1)),
            topDemand: ["vegetables", "fruits"],
            opportunityScore: 85
        },
        {
            month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(now.getFullYear(), (now.getMonth() + 2) % 12, 1)),
            topDemand: ["grains", "livestock"],
            opportunityScore: 72
        }
    ];

    // Low stock alerts
    const lowStockAlerts = (farmerProducts || [])
        .filter(p => Number(p.quantity) < 10 && p.is_available)
        .map(p => ({
            id: p.id,
            name: p.name,
            quantity: Number(p.quantity),
            unit: p.unit,
            isBestSeller: productPerformance.some(perf => perf.name === p.name && perf.count > 5)
        }))
        .sort((a, b) => a.quantity - b.quantity);

    return {
        totalRevenue,
        totalOrders,
        productPerformance,
        marketTrends,
        priceBenchmarks: benchmarks.sort((a, b) => Math.abs(b.diffPercentage) - Math.abs(a.diffPercentage)).slice(0, 4),
        customerLoyalty,
        seasonalForecast,
        lowStockAlerts
    };
}

export async function toggleLoyaltyReward({ farmerId, buyerId, active }: { farmerId: string, buyerId: string, active: boolean }) {
    const { data: existing } = await supabase
        .from("loyalty_discounts")
        .select("id")
        .eq("farmer_id", farmerId)
        .eq("buyer_id", buyerId)
        .single();

    if (existing) {
        await supabase
            .from("loyalty_discounts")
            .update({ is_active: active })
            .eq("id", existing.id);
    } else if (active) {
        await supabase
            .from("loyalty_discounts")
            .insert({
                farmer_id: farmerId,
                buyer_id: buyerId,
                discount_percentage: 10,
                order_count_threshold: 3,
                is_active: true
            });
    }
}

export async function getAIInsights({ stats }: { stats: any }) {
    try {
        const prompt = `Based on these farm statistics, provide 4 concise, actionable business insights for the farmer:
        Total Revenue: $${stats.totalRevenue}
        Total Orders: ${stats.totalOrders}
        Top Product: ${stats.productPerformance[0]?.name || 'N/A'}
        Market Trends: ${JSON.stringify(stats.marketTrends)}
        Low Stock: ${stats.lowStockAlerts.length} items
        Customer Loyalty: ${stats.customerLoyalty.length} repeat buyers.
        
        Format as a bulleted list. Focus on revenue growth and inventory optimization.`;

        const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { 
                messages: [
                    { role: "user", content: prompt }
                ] 
            }
        });

        if (error) throw error;
        return data.response || "No insights could be generated at this time.";

    } catch (e: any) {
        console.error("Failed to fetch AI insights", e);
        // Fallback to local logic if edge function fails (likely due to missing API key)
        return `Here are some insights based on your recent activity:
- Your top performing product is ${stats.productPerformance[0]?.name || 'currently undefined'}. Consider increasing production.
- Your total revenue is $${Math.round(stats.totalRevenue)}. Optimize your pricing to increase margins.
- Ensure you have enough stock before the next high-demand season.
- Offer loyalty discounts to your top ${stats.customerLoyalty.length} buyers to retain revenue.`;
    }
}

export async function getChatHistory() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from("ai_chat_history")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: true });

    if (error) return [];
    return data;
}

export async function chatWithAI(messages: { role: string, content: string }[]) {
    try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Not authenticated");

        // Save user message (if last message is from user)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
            await supabase.from("ai_chat_history").insert({
                user_id: userData.user.id,
                role: "user",
                content: lastMessage.content
            });
        }

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { messages }
        });

        if (error) throw error;
        const reply = data.response;

        // Save AI response to DB
        await supabase.from("ai_chat_history").insert({
            user_id: userData.user.id,
            role: "assistant",
            content: reply
        });

        return reply;
    } catch (error) {
        console.error("Failed to chat with AI", error);
        // Local fallback for dev/demo if Edge Function fails
        return "I'm your AI Assistant. I'm currently having trouble connecting to my central brain, but I can tell you that your farm is looking great! (Technical: Edge Function failed or GROQ_API_KEY missing)";
    }
}
