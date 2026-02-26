import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAUMatching = action({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not configured");
        }

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // 1. Get user profile and preferences
        const profile = await ctx.runQuery(api.users.getProfile);
        if (!profile) return [];

        // 2. Get available products
        // We'll just grab a sample of available products for the AI to pick from
        const allProducts = await ctx.runQuery(api.products.listAll, { limit: 50 });
        const availableProducts = allProducts.filter(p => p.is_available);

        if (availableProducts.length === 0) return [];

        // 3. Get recent search logs or chat history for preferences
        const chatHistory = await ctx.runQuery(api.ai.listHistory);
        const preferences = chatHistory
            .filter(m => m.role === "user")
            .map(m => m.content)
            .join(", ");

        const productsSummary = availableProducts.map(p =>
            `ID: ${p._id}, Name: ${p.name}, Category: ${p.category}, Price: ${p.price}, Location: ${p.location}`
        ).join("\n");

        const systemPrompt = `You are a matching assistant for an agricultural marketplace. 
        User Profile: ${profile.full_name}, Location: ${profile.location}.
        User Preferences/History: ${preferences || "No specific history yet"}.
        
        Given the following list of available products, return the top ${args.limit || 3} matches for this user.
        Format your response as a JSON array of product IDs only: ["id1", "id2", ...]`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Products:\n${productsSummary}\n\nTop matches:` }
                ],
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Groq API error (${response.status}):`, errorText);
            return [];
        }

        const data = await response.json();
        console.log("AI Matching raw response:", JSON.stringify(data));

        try {
            const contentString = data.choices[0].message.content;
            const content = JSON.parse(contentString);
            const matchedIds = content.matches || content.productIds || content.ids || Object.values(content)[0];

            if (Array.isArray(matchedIds)) {
                console.log(`Matched ${matchedIds.length} products`);
                const matches = await ctx.runQuery(api.products.getByIds, { ids: matchedIds });
                return matches;
            } else {
                console.warn("AI returned non-array matchedIds:", matchedIds);
            }
        } catch (e) {
            console.error("Failed to parse matching AI response. Content:", data.choices[0].message.content, e);
        }

        return [];
    },
});
