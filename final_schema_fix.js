/**
 * Final Schema Fix Script
 * Adds missing attributes to Appwrite collections.
 */

const API_KEY = '69796e940027732d8471';
const PROJECT_ID = "696bbd4b000e6aeb9cea";
const DATABASE_ID = "6978ad9f0002bb2dc06e";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
    'Content-Type': 'application/json'
};

async function callAppwrite(path, method = 'GET', body = null) {
    const url = `${ENDPOINT}${path}`;
    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    };

    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        if (data.code === 409) {
            console.log(`- Skipping ${path}: Already exists`);
            return data;
        }
        throw new Error(`${data.message} (${data.code})`);
    }
    return data;
}

async function fixSchema() {
    console.log("Starting schema fix...");

    try {
        // 1. Add is_read to messages
        console.log("Adding is_read to messages...");
        await callAppwrite(`/databases/${DATABASE_ID}/collections/messages/attributes/boolean`, 'POST', {
            key: 'is_read',
            required: false,
            default: false
        }).catch(e => console.log(`  Messages: ${e.message}`));

        // 2. Add is_read to notifications
        console.log("Adding is_read to notifications...");
        await callAppwrite(`/databases/${DATABASE_ID}/collections/notifications/attributes/boolean`, 'POST', {
            key: 'is_read',
            required: false,
            default: false
        }).catch(e => console.log(`  Notifications: ${e.message}`));

        // 3. Add last_message to conversations
        console.log("Adding last_message to conversations...");
        await callAppwrite(`/databases/${DATABASE_ID}/collections/conversations/attributes/string`, 'POST', {
            key: 'last_message',
            size: 1000,
            required: false
        }).catch(e => console.log(`  Conversations (last_message): ${e.message}`));

        // 4. Add last_sender_id to conversations
        console.log("Adding last_sender_id to conversations...");
        await callAppwrite(`/databases/${DATABASE_ID}/collections/conversations/attributes/string`, 'POST', {
            key: 'last_sender_id',
            size: 255,
            required: false
        }).catch(e => console.log(`  Conversations (last_sender_id): ${e.message}`));

        console.log("Schema fix complete!");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

fixSchema();
