import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const databases = new Databases(client);
    const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

    const payload = JSON.parse(req.body || '{}');
    const userId = payload.userId;

    if (!userId) {
        return res.json({ recommendations: [] });
    }

    try {
        // 1. Fetch user's recent orders to find preferred categories
        const orders = await databases.listDocuments(
            databaseId,
            'orders',
            [Query.equal('buyer_id', userId), Query.limit(10)]
        );

        const productIds = orders.documents.map(o => o.product_id);

        // 2. Fetch those products to get categories
        let preferredCategories = ['vegetables']; // Default category
        if (productIds.length > 0) {
            const productsFromOrders = await databases.listDocuments(
                databaseId,
                'products',
                [Query.equal('$id', productIds)]
            );
            preferredCategories = [...new Set(productsFromOrders.documents.map(p => p.category))];
        }

        // 3. Find other products in those categories that the user hasn't bought or just trending
        const recommendations = await databases.listDocuments(
            databaseId,
            'products',
            [
                Query.equal('category', preferredCategories),
                Query.equal('is_available', true),
                Query.limit(5)
            ]
        );

        return res.json({
            recommendations: recommendations.documents
        });

    } catch (e) {
        error("Error fetching recommendations: " + e.message);
        return res.json({ recommendations: [], error: e.message }, 500);
    }
};
