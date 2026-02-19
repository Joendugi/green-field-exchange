import { action } from "./_generated/server";
import { v } from "convex/values";

export const chat = action({
    args: {
        messages: v.array(
            v.object({
                role: v.string(),
                content: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not configured in Convex environment variables");
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are an agricultural AI assistant helping farmers and buyers with farming advice, market insights, pricing guidance, and best practices. Be helpful and knowledgeable about agriculture. Keep responses concise and practical.",
                    },
                    ...args.messages,
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${error}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "I had trouble generating a response. Please try again.";
    },
});
