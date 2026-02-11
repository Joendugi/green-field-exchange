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

    const numericHistory = priceHistory
      .map((entry: any) => {
        const price = Number(entry.price);
        const timestamp = new Date(entry.recorded_at).getTime();
        return Number.isFinite(price) && Number.isFinite(timestamp)
          ? { price, timestamp }
          : null;
      })
      .filter((entry): entry is { price: number; timestamp: number } => entry !== null);

    let suggestedPrice: number | null = null;
    let confidence: 'low' | 'medium' | 'high' = 'low';
    let reasoning = 'Not enough historical data. Showing simple average when available.';

    if (numericHistory.length >= 2) {
      const meanX = numericHistory.reduce((sum, entry) => sum + entry.timestamp, 0) / numericHistory.length;
      const meanY = numericHistory.reduce((sum, entry) => sum + entry.price, 0) / numericHistory.length;

      const numerator = numericHistory.reduce((sum, entry) => sum + (entry.timestamp - meanX) * (entry.price - meanY), 0);
      const denominator = numericHistory.reduce((sum, entry) => sum + Math.pow(entry.timestamp - meanX, 2), 0) || 1;

      const slope = numerator / denominator;
      const intercept = meanY - slope * meanX;
      const horizon = Date.now();
      suggestedPrice = Math.max(intercept + slope * horizon, 0);

      confidence = numericHistory.length > 25 ? 'high' : numericHistory.length > 10 ? 'medium' : 'low';
      reasoning = `Predicted with local least-squares regression over ${numericHistory.length} data points.`;
    } else if (numericHistory.length === 1) {
      suggestedPrice = numericHistory[0].price;
      confidence = 'low';
      reasoning = 'Only one historical price available. Using that value directly.';
    }

    if (suggestedPrice === null && numericHistory.length > 0) {
      suggestedPrice = numericHistory.reduce((sum, entry) => sum + entry.price, 0) / numericHistory.length;
      confidence = numericHistory.length > 10 ? 'medium' : 'low';
      reasoning = 'Based on simple average of recent prices.';
    }

    const prediction = {
      suggested_price: suggestedPrice,
      confidence,
      reasoning,
    };

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
