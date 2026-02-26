import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new order
export const create = mutation({
    args: {
        productId: v.id("products"),
        quantity: v.number(),
        payment_type: v.string(),
        delivery_address: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Input validation
        if (args.quantity <= 0 || args.quantity > 10000) {
            throw new Error("Invalid quantity. Must be between 1 and 10,000");
        }

        if (!Number.isInteger(args.quantity)) {
            throw new Error("Quantity must be a whole number");
        }

        // Validate payment type
        const validPaymentTypes = ["cash", "card", "mobile_money", "bank_transfer"];
        if (!validPaymentTypes.includes(args.payment_type.toLowerCase())) {
            throw new Error("Invalid payment type");
        }

        // Validate delivery address
        if (args.delivery_address.length < 10 || args.delivery_address.length > 500) {
            throw new Error("Delivery address must be between 10 and 500 characters");
        }

        // Sanitize delivery address (basic XSS prevention)
        const sanitizedAddress = args.delivery_address
            .replace(/[<>]/g, '')
            .trim();

        const buyer = await ctx.db.get(userId);
        if (!buyer) throw new Error("User not found");

        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        if (product.farmerId === userId) {
            throw new Error("You cannot order your own product");
        }

        if (product.quantity < args.quantity) {
            throw new Error(`Insufficient quantity. Only ${product.quantity} available.`);
        }

        const total_price = product.price * args.quantity;

        // Fix race condition: Atomically decrement product quantity BEFORE creating order
        await ctx.db.patch(args.productId, {
            quantity: product.quantity - args.quantity,
            updated_at: Date.now(),
        });

        try {
            const orderId = await ctx.db.insert("orders", {
                buyerId: buyer._id,
                farmerId: product.farmerId,
                productId: args.productId,
                quantity: args.quantity,
                total_price,
                currency: product.currency || "$",
                status: "pending",
                escrow_status: args.payment_type.toLowerCase() === "cash" ? "pending" : "awaiting_payment",
                payment_type: args.payment_type.toLowerCase(),
                delivery_address: sanitizedAddress,
                created_at: Date.now(),
                updated_at: Date.now(),
            });
            // Notify Farmer (In-app)
            await ctx.db.insert("notifications", {
                userId: product.farmerId,
                title: "New Order Received",
                message: `You have a new order for ${args.quantity} ${product.unit} of ${product.name}`,
                is_read: false,
                created_at: Date.now(),
                link: "/orders",
                type: "order",
            });

            // Trigger Emails
            const farmer = await ctx.db.get(product.farmerId);
            if (farmer?.email) {
                await ctx.scheduler.runAfter(0, api.emailService.sendOrderConfirmationEmail, {
                    email: farmer.email,
                    userName: farmer.name || "Farmer",
                    orderId: orderId,
                    details: {
                        productName: product.name,
                        quantity: args.quantity,
                        unit: product.unit,
                        currency: product.currency || "$",
                        totalPrice: total_price
                    },
                    isFarmer: true
                });
            }

            if (buyer.email) {
                await ctx.scheduler.runAfter(0, api.emailService.sendOrderConfirmationEmail, {
                    email: buyer.email,
                    userName: buyer.name || "Buyer",
                    orderId: orderId,
                    details: {
                        productName: product.name,
                        quantity: args.quantity,
                        unit: product.unit,
                        currency: product.currency || "$",
                        totalPrice: total_price
                    },
                    isFarmer: false
                });
            }

            return orderId;
        } catch (error) {
            // Rollback quantity if order creation fails
            await ctx.db.patch(args.productId, {
                quantity: product.quantity,
                updated_at: Date.now(),
            });
            throw error;
        }
    },
});

// List orders for the current user (either as buyer or farmer)
export const list = query({
    args: { role: v.optional(v.string()) }, // 'buyer' or 'farmer', optional
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        let orders;
        // Simple logic: fetch all where user is buyer OR farmer
        // Convex doesn't support OR in queries easily, so we might need two queries or careful indexing.

        // If role is specified, we optimize
        if (args.role === "farmer") {
            orders = await ctx.db
                .query("orders")
                .withIndex("by_farmerId", (q) => q.eq("farmerId", userId))
                .collect();
        } else if (args.role === "buyer") {
            orders = await ctx.db
                .query("orders")
                .withIndex("by_buyerId", (q) => q.eq("buyerId", userId))
                .collect();
        } else {
            // Fetch both and merge? Or just fetch relevant based on context.
            // For simplicity, let's assume the UI passes the role context or we return both.
            // Let's return valid orders for this user.
            const asBuyer = await ctx.db
                .query("orders")
                .withIndex("by_buyerId", (q) => q.eq("buyerId", userId))
                .collect();

            const asFarmer = await ctx.db
                .query("orders")
                .withIndex("by_farmerId", (q) => q.eq("farmerId", userId))
                .collect();

            // Merge and dedupe (though a user shouldn't start an order with themselves usually)
            const combined = [...asBuyer, ...asFarmer.filter(o => !asBuyer.some(b => b._id === o._id))];
            orders = combined;
        }

        // Sort by createdAt desc in memory
        orders.sort((a, b) => b.created_at - a.created_at);

        // Enhance with product details and profiles
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const product = await ctx.db.get(order.productId);

                const buyerProfile = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", order.buyerId))
                    .unique();

                const farmerProfile = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", order.farmerId))
                    .unique();

                // Fallback to user auth data if profile missing (optional)
                // const buyerUser = await ctx.db.get(order.buyerId);
                // const farmerUser = await ctx.db.get(order.farmerId);

                return {
                    ...order,
                    product,
                    buyer: buyerProfile,
                    farmer: farmerProfile,
                };
            })
        );

        return ordersWithDetails;
    },
});

export const updateStatus = mutation({
    args: {
        orderId: v.id("orders"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        // Only farmer can update status (except maybe 'cancelled' by buyer if pending)
        if (order.farmerId !== userId) {
            // Allow buyer to cancel if pending
            if (args.status === "cancelled" && order.buyerId === userId && order.status === "pending") {
                // Allowed
            } else {
                throw new Error("Unauthorized to update order status");
            }
        }

        await ctx.db.patch(args.orderId, {
            status: args.status,
            escrow_status: args.status === "cancelled" ? "refunded" : order.escrow_status,
            updated_at: Date.now(),
        });

        // Notify the other party
        const recipientId = userId === order.farmerId ? order.buyerId : order.farmerId;
        const updateMsg = args.status === "cancelled" ? "cancelled" : `updated to ${args.status}`;

        await ctx.db.insert("notifications", {
            userId: recipientId,
            title: "Order Update",
            message: `Order #${order._id} status has been ${updateMsg}`,
            is_read: false,
            created_at: Date.now(),
            link: "/orders",
            type: "order"
        });
    },
});

export const payOrder = mutation({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        if (order.buyerId !== userId) throw new Error("Unauthorized");
        if (order.status !== "pending") throw new Error("Order is not in pending state");

        // In a real app, this is where we'd wait for Stripe/PayPal confirmation.
        // For this implementation, we'll mark it as paid.
        await ctx.db.patch(args.orderId, {
            escrow_status: "held",
            updated_at: Date.now(),
        });

        await ctx.db.insert("notifications", {
            userId: order.farmerId,
            title: "Order Paid",
            message: `Order #${order._id} has been paid. You can now prepare for shipment.`,
            is_read: false,
            created_at: Date.now(),
            link: "/orders",
            type: "order"
        });
    }
});


export const sendOrderReminders = mutation({
    args: {},
    handler: async (ctx) => {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

        const pendingOrders = await ctx.db
            .query("orders")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .filter((q) => q.lt(q.field("updated_at"), twentyFourHoursAgo))
            .collect();

        for (const order of pendingOrders) {
            await ctx.db.insert("notifications", {
                userId: order.farmerId,
                title: "Pending Order Reminder",
                message: `You have a pending order #${order._id} from ${twentyFourHoursAgo > order.created_at ? 'yesterday' : 'earlier'}. Please accept or reject it.`,
                is_read: false,
                created_at: Date.now(),
                link: "/orders",
                type: "order"
            });
        }
        return pendingOrders.length;
    }
});
