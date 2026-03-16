import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "./helpers";
import { internalMutation } from "./_generated/server";

export const listHistory = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        return await ctx.db
            .query("ai_chat_history")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(20); // Keep last 20 messages for UI loading
    },
});

export const saveMessage = internalMutation({
    args: { userId: v.id("users"), role: v.string(), content: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert("ai_chat_history", {
            userId: args.userId,
            role: args.role,
            content: args.content,
            created_at: Date.now(),
        });
    },
});

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

        const userId = await getAuthUserId(ctx);
        let userContext = "";
        let historicContext = "";

        if (userId) {
            const profile = await ctx.runQuery(api.users.getProfile);
            const roleData = await ctx.runQuery(api.users.getRole, { userId });

            // Get last few interactions for "memory"
            const history = await ctx.runQuery(api.ai.listHistory);
            if (history && history.length > 0) {
                // Formatting history for the prompt
                const lastFew = history.reverse().slice(-5); // Use last 5 messages as memory
                historicContext = `\n\n### SUMMARY OF RECENT PAST INTERACTIONS FOR MEMORY:\n${lastFew.map(m => `- ${m.role === 'user' ? 'User asked' : 'Assistant answered'}: ${m.content.slice(0, 150)}...`).join('\n')}\n(Use this to maintain continuity and remember previous topics discussed).`;
            }

            if (profile) {
                userContext = ` The user you are helping is ${profile.full_name || profile.username}.`;
                if (roleData?.role) {
                    userContext += ` They are registered as a ${roleData.role}.`;
                }
                if (profile.location) {
                    userContext += ` They are located in ${profile.location}.`;
                }
            }

            // Save the user's latest message to history
            const latestUserMessage = args.messages[args.messages.length - 1];
            if (latestUserMessage && latestUserMessage.role === "user") {
                await ctx.runMutation(internal.ai.saveMessage, {
                    userId,
                    role: "user",
                    content: latestUserMessage.content,
                } as any);
            }
        }

        const systemPrompt = `You are an agricultural AI assistant helping farmers and buyers with advice and market insights. Be helpful and knowledgeable about agriculture.${userContext}${historicContext} Keep responses concise and practical. Use the user's name if available.`;

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
                        content: systemPrompt,
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
        const assistantContent = data.choices?.[0]?.message?.content ?? "I had trouble generating a response.";

        // Save assistant response to history
        if (userId) {
            await ctx.runMutation(internal.ai.saveMessage, {
                userId,
                role: "assistant",
                content: assistantContent,
            } as any);
        }

        return assistantContent;
    },
});

export const getFarmerInsights = action({
    args: {
        stats: v.object({
            totalRevenue: v.number(),
            totalOrders: v.number(),
            productPerformance: v.array(v.any()),
            marketTrends: v.object({
                categories: v.array(v.any()),
                locations: v.array(v.any()),
            }),
        }),
    },
    handler: async (ctx, args) => {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) return "AI Insights are currently unavailable.";

        const { stats } = args;
        const profile = await ctx.runQuery(api.users.getProfile);

        const prompt = `As an expert agricultural business consultant, analyze the following performance data for farmer ${profile?.full_name || 'the user'}:
        - Total Revenue: $${stats.totalRevenue}
        - Total Orders: ${stats.totalOrders}
        - Top Products: ${stats.productPerformance.slice(0, 3).map(p => `${p.name} ($${p.revenue})`).join(', ')}
        - Market Trends: High demand for ${stats.marketTrends.categories.map(c => c[0]).join(', ')} in areas like ${stats.marketTrends.locations.map(l => l[0]).join(', ')}.

        Provide 3 specific, actionable "Pro-Tips" for this farmer to grow their business on the Wakulima platform. Keep each tip under 30 words. Format as a bulleted list.`;

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
                        content: "You are a concise agricultural business advisor.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok) return "Unable to generate insights at this moment.";
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No insights found.";
    },
});
