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
    const { category, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch price history data for this category and location
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const priceHistoryResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/price_history?category=eq.${category}&location=eq.${location}&order=recorded_at.desc&limit=50`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const priceHistory = await priceHistoryResponse.json();

    // Use AI to analyze price trends and predict fair price
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
            content: 'You are an agricultural pricing expert. Analyze price history data and provide fair price predictions. Return ONLY a JSON object with keys: suggested_price (number), confidence (low/medium/high), reasoning (string).'
          },
          {
            role: 'user',
            content: `Based on this price history for ${category} in ${location}:\n${JSON.stringify(priceHistory)}\n\nWhat is the fair market price? Consider recent trends, seasonality, and preventing exploitation of farmers.`
          }
        ],
      }),
    });

    const data = await response.json();
    const aiReply = data.choices[0].message.content;
    
    // Parse AI response to extract structured data
    let prediction;
    try {
      prediction = JSON.parse(aiReply);
    } catch {
      // If AI didn't return valid JSON, calculate simple average
      const avgPrice = priceHistory.length > 0
        ? priceHistory.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0) / priceHistory.length
        : 0;
      
      prediction = {
        suggested_price: avgPrice > 0 ? avgPrice : null,
        confidence: priceHistory.length > 10 ? 'medium' : 'low',
        reasoning: 'Based on simple average of recent prices.',
      };
    }

    return new Response(
      JSON.stringify(prediction),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Price prediction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
