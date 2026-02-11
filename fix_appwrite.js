/**
 * AgriLink Fix Script
 * 
 * 1. Renames 'read' to 'is_read' in notifications (recreates attribute).
 * 2. Updates storage bucket permissions to allow authenticated users to upload.
 * 
 * Usage: node fix_appwrite.js <YOUR_API_KEY>
 */

const [, , apiKey] = process.argv;
if (!apiKey) {
    console.error("Error: Please provide your Appwrite API Key.");
    process.exit(1);
}

const PROJECT_ID = "696bbd4b000e6aeb9cea";
const DATABASE_ID = "6978ad9f0002bb2dc06e";
const BUCKET_ID = "6978bbae00198d429303";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': apiKey,
    'Content-Type': 'application/json'
};

async function call(path, method = 'GET', body = null) {
    const url = `${ENDPOINT}${path}`;
    const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null });

    let data = {};
    const text = await response.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { message: text };
        }
    }

    return { ok: response.ok, status: response.status, data };
}

async function fix() {
    console.log("--- Starting AgriLink Fixes ---");

    // 1. Fix Notification Attribute
    console.log("1. Fixing 'notifications' collection...");
    // Try to delete old if exists
    await call(`/databases/${DATABASE_ID}/collections/notifications/attributes/read`, 'DELETE');
    // Create new is_read
    const resRead = await call(`/databases/${DATABASE_ID}/collections/notifications/attributes/boolean`, 'POST', {
        key: "is_read",
        required: false,
        default: false
    });
    if (resRead.ok) console.log("  [FIXED] 'is_read' attribute created.");
    else console.log("  [INFO] 'is_read' might already exist or failed: " + resRead.data.message);

    // 2. Fix Bucket Permissions
    console.log("2. Updating Storage Bucket permissions...");
    const resBucket = await call(`/storage/buckets/${BUCKET_ID}`, 'PUT', {
        name: "Post Images",
        permissions: ["read(\"any\")", "create(\"users\")", "update(\"users\")", "delete(\"users\")"],
        fileSecurity: true,
        enabled: true
    });
    if (resBucket.ok) console.log("  [FIXED] Bucket permissions updated for authenticated users.");
    else console.log("  [FAILED] Could not update bucket: " + resBucket.data.message);

    console.log("--- Fixes Complete ---");
}

fix();
