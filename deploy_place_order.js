/**
 * Deploy Place Order Function
 * Usage: node deploy_place_order.js <YOUR_API_KEY>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , apiKey] = process.argv;

if (!apiKey) {
    console.error("Error: Please provide your Appwrite API Key.");
    console.log("Usage: node deploy_place_order.js <YOUR_API_KEY>");
    process.exit(1);
}

const PROJECT_ID = "696bbd4b000e6aeb9cea";
const DATABASE_ID = "6978ad9f0002bb2dc06e";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const FUNCTION_NAME = "place-order";
const FUNCTION_ID = "place-order"; // We will try to use this ID
const RUNTIME = "node-18.0";

const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': apiKey,
    'Content-Type': 'application/json' // Default, will change for file upload
};

async function callAppwrite(path, method = 'GET', body = null, isFile = false) {
    const url = `${ENDPOINT}${path}`;
    const options = {
        method,
        headers: { ...headers }
    };

    if (isFile) {
        delete options.headers['Content-Type']; // Let fetch set boundaries for FormData
        options.body = body;
    } else {
        options.body = body ? JSON.stringify(body) : null;
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        // Log more detail if available
        throw new Error(`${data.message || response.statusText} (${response.status})`);
    }
    return data;
}

async function deploy() {
    console.log(`Deploying function '${FUNCTION_NAME}'...`);

    // 1. Create Zipped Code
    const funcDir = path.join(__dirname, 'functions', 'place-order');
    const zipPath = path.join(__dirname, 'place-order.tar.gz');

    // Using tar to create a gzip archive (standard for Appwrite functions)
    // Windows might need a different command or use a library, assuming users environment has tar
    try {
        console.log("Creating code archive...");
        if (process.platform === 'win32') {
            // Basic tar command that usually works on Win10+
            execSync(`tar -czf "${zipPath}" -C "${funcDir}" .`);
        } else {
            execSync(`tar -czf "${zipPath}" -C "${funcDir}" .`);
        }
    } catch (e) {
        console.error("Error zipping files. Ensure you have 'tar' installed.");
        console.error(e.message);
        process.exit(1);
    }

    try {
        // 2. Check if function exists, create if not
        let functionId = FUNCTION_ID;
        try {
            await callAppwrite(`/functions/${FUNCTION_ID}`);
            console.log("Function exists. Updating...");
        } catch (e) {
            if (e.message.includes("404")) {
                console.log("Function not found. Creating...");
                const func = await callAppwrite('/functions', 'POST', {
                    functionId: FUNCTION_ID,
                    name: FUNCTION_NAME,
                    runtime: RUNTIME,
                    execute: ["any"], // Public execution allowed? Or restricting to users?
                    // Usually we restrict execution to specific users or 'users'
                    // For now "users" (authenticated users)
                    execute: ["users"]
                });
                functionId = func.$id;
            } else {
                throw e;
            }
        }

        // 3. Upload Deployment
        console.log("Uploading deployment...");
        const formData = new FormData();
        const blob = new Blob([fs.readFileSync(zipPath)], { type: 'application/gzip' });
        formData.append('entrypoint', 'src/main.js');
        formData.append('code', blob, 'code.tar.gz');
        formData.append('activate', 'true');

        const deployment = await callAppwrite(`/functions/${functionId}/deployments`, 'POST', formData, true);
        console.log(`Deployment created: ${deployment.$id}`);

        // 4. Update Variables
        console.log("Updating environment variables...");
        const variables = {
            APPWRITE_API_KEY: apiKey,
            APPWRITE_DATABASE_ID: DATABASE_ID
        };

        for (const [key, value] of Object.entries(variables)) {
            try {
                // Try create
                await callAppwrite(`/functions/${functionId}/variables`, 'POST', { key, value });
            } catch (e) {
                // Try update if conflict
                if (e.message.includes("409")) {
                    await callAppwrite(`/functions/${functionId}/variables/${key}`, 'PUT', { key, value });
                }
            }
        }

        console.log("SUCCESS: Function deployed and active!");
        console.log("Cleaning up...");
        fs.unlinkSync(zipPath);

    } catch (error) {
        console.error("Deployment Failed:", error.message);
    }
}

deploy();
