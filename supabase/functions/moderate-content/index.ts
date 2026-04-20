import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all active posts and products for scanning
    const [{ data: posts }, { data: products }] = await Promise.all([
      supabase.from("posts").select("id, content").eq("is_hidden", false).limit(50),
      supabase.from("products").select("id, name, description").eq("is_hidden", false).limit(50),
    ]);

    const itemsToScan = [
      ...(posts || []).map((p) => ({ id: p.id, type: "post", text: p.content })),
      ...(products || []).map((p) => ({
        id: p.id,
        type: "product",
        text: `${p.name}: ${p.description}`,
      })),
    ];

    if (itemsToScan.length === 0) {
      return new Response(JSON.stringify({ flagged: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call LLM for moderation
    const prompt = `You are a content moderator for a farmer marketplace called " wakulima agri-connect Exchange". 
    Analyze the following list of items and identify any that violate policies:
    - Spam or irrelevant content
    - Offensive or abusive language
    - Fraudulent/fake product descriptions
    - Personal contact info where it shouldn't be
    
    Items:
    ${JSON.stringify(itemsToScan)}
    
    Return a JSON object with a "flagged" array. Each flagged item must have:
    - id
    - type ("post" or "product")
    - content (the original snippet)
    - reason (short explanation)
    - confidence ("high", "medium", "low")
    
    If nothing is offensive, return an empty array for flagged. 
    Return ONLY valid JSON.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    const aiResult = await response.json();
    const resultJson = JSON.parse(aiResult.choices[0].message.content);

    return new Response(JSON.stringify(resultJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
