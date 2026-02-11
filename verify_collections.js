const PROJECT_ID = "696bbd4b000e6aeb9cea";
const DATABASE_ID = "6978ad9f0002bb2dc06e";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

const collections = [
    "user_roles",
    "profiles",
    "products",
    "orders",
    "posts",
    "messages",
    "conversations",
    "follows",
    "notifications",
    "user_settings",
    "post_likes",
    "post_comments",
    "post_reposts",
    "verification_requests"
];

const checkCollection = async (collectionId) => {
    const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Appwrite-Project': PROJECT_ID,
                'Content-Type': 'application/json'
            }
        });
        return { id: collectionId, status: response.status };
    } catch (e) {
        return { id: collectionId, status: 'ERROR', error: e.message };
    }
};

async function verify() {
    console.log("Verifying Collections...");
    console.log("--------------------------------");
    let allExist = true;

    for (const id of collections) {
        const result = await checkCollection(id);
        if (result.status === 404) {
            console.log(`[MISSING] ${id} (404)`);
            allExist = false;
        } else if (result.status === 401) {
            console.log(`[EXISTS]  ${id} (401 - Protected)`);
        } else if (result.status === 200) {
            console.log(`[EXISTS]  ${id} (200 - Public/Accessible)`);
        } else {
            console.log(`[UNKNOWN] ${id} (${result.status})`);
        }
    }
    console.log("--------------------------------");
    if (allExist) {
        console.log("SUCCESS: All collections appear to exist.");
    } else {
        console.log("FAILURE: Some collections are missing. Please create them with the exact IDs shown.");
    }
}

verify();
