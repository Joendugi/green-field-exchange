import { Client, Databases, Permission, Role, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        const { buyerId, product, quantity, deliveryAddress } = JSON.parse(req.body);

        if (!buyerId || !product || !quantity || !deliveryAddress) {
            throw new Error("Missing required fields: buyerId, product, quantity, deliveryAddress");
        }

        const { $id: productId, farmer_id: farmerId, price, name: productName } = product;
        const totalPrice = quantity * price;
        const dbId = process.env.APPWRITE_DATABASE_ID;

        log(`Creating order for Product: ${productName}, Buyer: ${buyerId}, Farmer: ${farmerId}`);

        // Create Order with permissions for both Buyer and Farmer
        const order = await databases.createDocument(
            dbId,
            "orders",
            ID.unique(),
            {
                product_id: productId,
                buyer_id: buyerId,
                farmer_id: farmerId,
                quantity: quantity,
                total_price: totalPrice,
                delivery_address: deliveryAddress,
                payment_type: "traditional",
                status: "pending"
            },
            [
                Permission.read(Role.user(buyerId)),
                Permission.read(Role.user(farmerId)),
                Permission.write(Role.user(buyerId)),
                Permission.update(Role.user(farmerId))
            ]
        );

        // Create Notification for Farmer
        await databases.createDocument(
            dbId,
            "notifications",
            ID.unique(),
            {
                user_id: farmerId,
                type: "order",
                title: "New Order Received",
                message: `You have a new order for ${productName} (${quantity} units)`,
                link: "/profile?tab=orders",
                is_read: false
            }
        );

        return res.json({
            success: true,
            message: "Order placed successfully",
            orderId: order.$id
        });

    } catch (err) {
        error("Order Processing Error: " + err.message);
        return res.json({
            success: false,
            message: err.message
        }, 500);
    }
};
