/**
 * Admin Authority Schema Migration
 * Adds new attributes for user banning and content moderation.
 * 
 * Usage: node migrate_admin_authority.js <YOUR_API_KEY>
 */

const [, , apiKey] = process.argv;
if (!apiKey) {
    console.error("Error: Please provide your Appwrite API Key.");
    console.log("Usage: node migrate_admin_authority.js <YOUR_API_KEY>");
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
    const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null });
    const data = await response.json();
    if (!response.ok && data.code !== 409) {
        throw new Error(`${data.message} (${data.code})`);
    }
    return { ok: response.ok, data };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function migrate() {
    console.log("Starting Admin Authority Schema Migration...\n");

    const attributes = [
        // Profiles - for user banning
        { collection: "profiles", key: "is_banned", type: "boolean", default: false },
        { collection: "profiles", key: "ban_reason", type: "string", size: 500 },

        // Posts - for content moderation
        { collection: "posts", key: "is_hidden", type: "boolean", default: false },
        { collection: "posts", key: "hidden_reason", type: "string", size: 500 },

        // Products - for marketplace moderation
        { collection: "products", key: "is_hidden", type: "boolean", default: false },
        { collection: "products", key: "hidden_reason", type: "string", size: 500 },
    ];

    for (const attr of attributes) {
        console.log(`Adding ${attr.key} to ${attr.collection}...`);
        try {
            let path = `/databases/${DATABASE_ID}/collections/${attr.collection}/attributes/`;
            let body = { key: attr.key, required: false };

            if (attr.type === "boolean") {
                path += "boolean";
                body.default = attr.default;
            } else if (attr.type === "string") {
                path += "string";
                body.size = attr.size;
            }

            const result = await callAppwrite(path, 'POST', body);
            if (result.ok) {
                console.log(`  ✓ Added ${attr.key}`);
            } else {
                console.log(`  - Skipped (already exists or error)`);
            }
            await sleep(500);
        } catch (error) {
            console.log(`  ✗ Failed: ${error.message}`);
        }
    }

    console.log("\n--- Migration Complete ---");
}

migrate();
