/**
 * Appwrite Automated Setup Script
 * 
 * Usage:
 * 1. Create an API Key in Appwrite Console with these scopes:
 *    - collections.write
 *    - attributes.write
 *    - indexes.write
 *    - buckets.write
 * 2. Run: node appwrite_setup.js <YOUR_API_KEY>
 */

const [, , apiKey] = process.argv;

if (!apiKey) {
    console.error("Error: Please provide your Appwrite API Key.");
    console.log("Usage: node appwrite_setup.js <YOUR_API_KEY>");
    process.exit(1);
}

const PROJECT_ID = "696bbd4b000e6aeb9cea";
const DATABASE_ID = "6978ad9f0002bb2dc06e";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': apiKey,
    'Content-Type': 'application/json'
};

async function callAppwrite(path, method = 'GET', body = null) {
    const url = `${ENDPOINT}${path}`;
    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    };

    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            throw new Error(`Unauthorized (401): Please check if your API Key is correct and has the necessary scopes for ${method} ${path}`);
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`${data.message || response.statusText} (${response.status}) at ${method} ${path}`);
        }
        return data;
    } catch (e) {
        if (e.message.includes("Unauthorized")) throw e;
        throw new Error(`${e.message} at ${method} ${url}`);
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setup() {
    try {
        console.log("Starting Appwrite Automated Setup...");

        const schema = {
            collections: [
                {
                    id: "user_roles",
                    name: "User Roles",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "role", type: "string", size: 50, required: true },
                        { key: "is_verified", type: "boolean", default: false, required: false }
                    ]
                },
                {
                    id: "profiles",
                    name: "Profiles",
                    attributes: [
                        { key: "full_name", type: "string", size: 255, required: false },
                        { key: "username", type: "string", size: 255, required: false },
                        { key: "location", type: "string", size: 255, required: false },
                        { key: "bio", type: "string", size: 1000, required: false },
                        { key: "avatar_url", type: "string", size: 2000, required: false }
                    ]
                },
                {
                    id: "products",
                    name: "Products",
                    attributes: [
                        { key: "name", type: "string", size: 255, required: true },
                        { key: "description", type: "string", size: 1000, required: false },
                        { key: "price", type: "float", required: true },
                        { key: "unit", type: "string", size: 50, required: false },
                        { key: "quantity", type: "float", required: true },
                        { key: "category", type: "string", size: 50, required: false },
                        { key: "image_url", type: "string", size: 2000, required: false },
                        { key: "farmer_id", type: "string", size: 255, required: true },
                        { key: "is_available", type: "boolean", default: true, required: false },
                        { key: "location", type: "string", size: 255, required: false }
                    ]
                },
                {
                    id: "orders",
                    name: "Orders",
                    attributes: [
                        { key: "product_id", type: "string", size: 255, required: true },
                        { key: "buyer_id", type: "string", size: 255, required: true },
                        { key: "farmer_id", type: "string", size: 255, required: true },
                        { key: "quantity", type: "float", required: true },
                        { key: "total_price", type: "float", required: true },
                        { key: "delivery_address", type: "string", size: 1000, required: false },
                        { key: "payment_type", type: "string", size: 50, required: false },
                        { key: "status", type: "string", size: 50, default: "pending", required: false }
                    ]
                },
                {
                    id: "posts",
                    name: "Posts",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "content", type: "string", size: 5000, required: false },
                        { key: "image_url", type: "string", size: 2000, required: false },
                        { key: "video_url", type: "string", size: 2000, required: false }
                    ]
                },
                {
                    id: "messages",
                    name: "Messages",
                    attributes: [
                        { key: "conversation_id", type: "string", size: 255, required: true },
                        { key: "sender_id", type: "string", size: 255, required: true },
                        { key: "content", type: "string", size: 5000, required: true },
                        { key: "is_read", type: "boolean", default: false, required: false }
                    ]
                },
                {
                    id: "conversations",
                    name: "Conversations",
                    attributes: [
                        { key: "participant1_id", type: "string", size: 255, required: true },
                        { key: "participant2_id", type: "string", size: 255, required: true },
                        { key: "updated_at", type: "string", size: 100, required: true },
                        { key: "last_message", type: "string", size: 1000, required: false },
                        { key: "last_sender_id", type: "string", size: 255, required: false }
                    ]
                },
                {
                    id: "follows",
                    name: "Follows",
                    attributes: [
                        { key: "follower_id", type: "string", size: 255, required: true },
                        { key: "following_id", type: "string", size: 255, required: true }
                    ]
                },
                {
                    id: "notifications",
                    name: "Notifications",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "type", type: "string", size: 50, required: false },
                        { key: "title", type: "string", size: 255, required: false },
                        { key: "message", type: "string", size: 1000, required: false },
                        { key: "link", type: "string", size: 255, required: false },
                        { key: "is_read", type: "boolean", default: false, required: false }
                    ]
                },
                {
                    id: "user_settings",
                    name: "User Settings",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "dark_mode", type: "boolean", default: false, required: false },
                        { key: "notifications_enabled", type: "boolean", default: true, required: false },
                        { key: "ai_assistant_enabled", type: "boolean", default: true, required: false }
                    ]
                },
                {
                    id: "verification_requests",
                    name: "Verification Requests",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "status", type: "string", size: 50, default: "pending", required: false },
                        { key: "created_at", type: "string", size: 50, required: true }
                    ]
                },
                {
                    id: "post_likes",
                    name: "Post Likes",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "post_id", type: "string", size: 255, required: true }
                    ]
                },
                {
                    id: "post_comments",
                    name: "Post Comments",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "post_id", type: "string", size: 255, required: true },
                        { key: "content", type: "string", size: 1000, required: true }
                    ]
                },
                {
                    id: "post_reposts",
                    name: "Post Reposts",
                    attributes: [
                        { key: "user_id", type: "string", size: 255, required: true },
                        { key: "post_id", type: "string", size: 255, required: true }
                    ]
                }
            ],
            buckets: [
                { id: "6978bbae00198d429303", name: "Post Images" }
            ]
        };

        // 1. Create Collections
        for (const col of schema.collections) {
            console.log(`Checking collection: ${col.id}...`);
            try {
                await callAppwrite(`/databases/${DATABASE_ID}/collections/${col.id}`);
                console.log(`  Collection ${col.id} already exists.`);
            } catch (e) {
                console.log(`  Creating collection ${col.id}...`);
                await callAppwrite(`/databases/${DATABASE_ID}/collections`, 'POST', {
                    collectionId: col.id,
                    name: col.name,
                    permissions: ["read(\"any\")", "create(\"users\")", "update(\"users\")", "delete(\"users\")"],
                    documentSecurity: true
                });
                console.log(`  Collection ${col.id} created.`);

                // Wait for collection to be ready
                await sleep(2000);

                // Add Attributes
                for (const attr of col.attributes) {
                    console.log(`    Adding attribute: ${attr.key}...`);
                    let path = `/databases/${DATABASE_ID}/collections/${col.id}/attributes/`;
                    const body = { key: attr.key, required: attr.required };

                    if (attr.type === "string") {
                        path += 'string';
                        body.size = attr.size;
                        if (attr.default !== undefined) body.default = attr.default;
                    } else if (attr.type === "boolean") {
                        path += 'boolean';
                        if (attr.default !== undefined) body.default = attr.default;
                    } else if (attr.type === "float") {
                        path += 'float';
                    } else if (attr.type === "integer") {
                        path += 'integer';
                    }

                    await callAppwrite(path, 'POST', body);
                    await sleep(500);
                }
            }
        }

        // 2. Create Buckets
        for (const bucket of schema.buckets) {
            const currentBucketId = bucket.id;
            console.log(`Checking bucket: ${currentBucketId}...`);
            try {
                await callAppwrite(`/storage/buckets/${currentBucketId}`);
                console.log(`  Bucket ${currentBucketId} already exists.`);
            } catch (e) {
                if (e.message.includes("404") || e.message.includes("not found")) {
                    console.log(`  Creating bucket ${currentBucketId}...`);
                    await callAppwrite(`/storage/buckets`, 'POST', {
                        bucketId: currentBucketId,
                        name: bucket.name,
                        permissions: ["read(\"any\")", "create(\"users\")", "update(\"users\")", "delete(\"users\")"],
                        fileSecurity: true
                    });
                    console.log(`  Bucket ${currentBucketId} created.`);
                } else {
                    console.warn(`  Warning: Could not verify or create bucket ${currentBucketId}: ${e.message}`);
                }
            }
        }

        console.log("--------------------------------");
        console.log("SUCCESS: Appwrite setup complete!");
    } catch (error) {
        console.error("ERROR during setup:", error.message);
    }
}

setup();
