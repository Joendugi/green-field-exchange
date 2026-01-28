import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('696bbd4b000e6aeb9cea')
    .setKey('69796e940027732d8471');

const databases = new Databases(client);
const DB_ID = '6978ad9f0002bb2dc06e';

async function migrate() {
    console.log("Adding new attributes for Messaging enhancements...");

    try {
        // 1. Add is_read to messages
        await databases.createBooleanAttribute(DB_ID, 'messages', 'is_read', false, false);
        console.log("- Added 'is_read' to messages");

        // 2. Add last_message to conversations
        await databases.createStringAttribute(DB_ID, 'conversations', 'last_message', 1000, false);
        console.log("- Added 'last_message' to conversations");

        // 3. Add last_sender_id to conversations
        await databases.createStringAttribute(DB_ID, 'conversations', 'last_sender_id', 255, false);
        console.log("- Added 'last_sender_id' to conversations");

        console.log("Migration complete!");
    } catch (error) {
        console.error("Migration error (some might already exist):", error.message);
    }
}

migrate();
