import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const payload = JSON.parse(req.body || '{}');
    const messages = payload.messages || [];

    if (messages.length === 0) {
        return res.json({ response: "I didn't receive any messages to process." }, 400);
    }

    // Logic: In a real app, you'd call OpenAI/Google Gemini here.
    // For this template, we simulate a helpful AgriLink response.
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    let response = "I'm processing your request. As an AgriLink AI, I suggest checking the marketplace for the latest seasonal prices.";

    if (lastMessage.includes("price") || lastMessage.includes("cost")) {
        response = "Currently, maize and tomatoes are seeing a 5% price increase in the northern region. I recommend monitoring the market daily.";
    } else if (lastMessage.includes("help") || lastMessage.includes("advice")) {
        response = "I can help with crop rotation strategies, fertilizer recommendations, and finding the best buyers for your harvest.";
    }

    return res.json({
        response: response
    });
};
