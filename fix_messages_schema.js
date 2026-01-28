/**
 * Fix Messages Schema - Add is_read attribute
 * 
 * Usage: node fix_messages_schema.js <YOUR_API_KEY>
 */

const [, , apiKey] = process.argv;
if (!apiKey) {
    console.error("Error: Please provide your Appwrite API Key.");
    console.log("Usage: node fix_messages_schema.js <YOUR_API_KEY>");
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

async function migrate() {
    console.log("Adding is_read attribute to messages collection...\n");

    try {
        const result = await callAppwrite(
            `/databases/${DATABASE_ID}/collections/messages/attributes/boolean`,
            'POST',
            {
                key: 'is_read',
                required: false,
                default: false
            }
        );

        if (result.ok) {
            console.log("✓ Added is_read to messages collection");
        } else {
            console.log("- Attribute may already exist or failed");
        }
    } catch (error) {
        console.log("✗ Failed:", error.message);
    }

    // Also add to notifications if missing
    try {
        const result = await callAppwrite(
            `/databases/${DATABASE_ID}/collections/notifications/attributes/boolean`,
            'POST',
            {
                key: 'is_read',
                required: false,
                default: false
            }
        );

        if (result.ok) {
            console.log("✓ Added is_read to notifications collection");
        } else {
            console.log("- Notifications attribute may already exist");
        }
    } catch (error) {
        console.log("- Notifications:", error.message);
    }

    console.log("\n--- Done ---");
}

migrate();
