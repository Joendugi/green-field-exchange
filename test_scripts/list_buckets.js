/**
 * Appwrite Bucket Lister
 * Usage: node list_buckets.js <YOUR_API_KEY>
 */
const [, , apiKey] = process.argv;
if (!apiKey) {
    console.error("Error: Please provide your Appwrite API Key.");
    process.exit(1);
}

const PROJECT_ID = "696bbd4b000e6aeb9cea";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

async function listBuckets() {
    try {
        const response = await fetch(`${ENDPOINT}/storage/buckets`, {
            headers: {
                'X-Appwrite-Project': PROJECT_ID,
                'X-Appwrite-Key': apiKey
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        console.log("\n--- Available Buckets ---");
        data.buckets.forEach(b => {
            console.log(`ID: ${b.$id} | Name: ${b.name}`);
        });
        console.log("-------------------------\n");
    } catch (e) {
        console.error("Error:", e.message);
    }
}
listBuckets();
