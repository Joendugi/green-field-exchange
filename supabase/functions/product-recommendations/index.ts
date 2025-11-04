import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required environment variables not configured');
    }

    // Fetch user's order history
    const ordersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${userId}&select=product_id,products(name,category)&order=created_at.desc&limit=20`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const orders = await ordersResponse.json();

    // Fetch available products
    const productsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/products?is_available=eq.true&select=id,name,category,price,description&limit=100`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const products = await productsResponse.json();

    // Use AI to recommend products based on purchase history
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an agricultural product recommendation expert. Based on purchase history, recommend complementary products. Return ONLY a JSON array of product IDs (strings) that would be good recommendations, limited to 6 items.'
          },
          {
            role: 'user',
            content: `User purchase history:\n${JSON.stringify(orders)}\n\nAvailable products:\n${JSON.stringify(products)}\n\nRecommend complementary products this buyer might want.`
          }
        ],
      }),
    });

    const data = await response.json();
    const aiReply = data.choices[0].message.content;
    
    let recommendations;
    try {
      recommendations = JSON.parse(aiReply);
    } catch {
      // If AI fails, return empty array
      recommendations = [];
    }

    // Fetch full product details for recommendations
    const recommendedProducts = products.filter((p: any) => 
      recommendations.includes(p.id)
    );

    return new Response(
      JSON.stringify({ recommendations: recommendedProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(
      JSON.stringify({ recommendations: [], error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
