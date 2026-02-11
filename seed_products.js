/**
 * Appwrite Product Seeding Script
 * 
 * Usage: node seed_products.js <YOUR_API_KEY> <FARMER_USER_ID>
 */

const [, , apiKey, farmerId] = process.argv;

if (!apiKey || !farmerId) {
    console.error("Error: Please provide your Appwrite API Key and a Farmer User ID.");
    console.log("Usage: node seed_products.js <YOUR_API_KEY> <FARMER_USER_ID>");
    process.exit(1);
}

const PROJECT_ID = "696bbd4b000e6aeb9cea";
const DATABASE_ID = "6978ad9f0002bb2dc06e";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

const sampleProducts = [
    {
        name: "Fresh Organic Tomatoes",
        description: "Vine-ripened, juicy red tomatoes grown without pesticides.",
        price: 2.5,
        unit: "kg",
        quantity: 100,
        category: "vegetables",
        location: "Green Valley Farm",
        image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Premium Basmati Rice",
        description: "Long-grain aromatic rice, aged for 12 months for extra flavor.",
        price: 15.0,
        unit: "5kg bag",
        quantity: 50,
        category: "grains",
        location: "Golden Fields",
        image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Farm Fresh Eggs",
        description: "Organic, free-range eggs from happy chickens.",
        price: 4.0,
        unit: "dozen",
        quantity: 30,
        category: "poultry",
        location: "Sunny Side Farm",
        image_url: "https://images.unsplash.com/photo-1582722134903-b12eeed38644?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Sweet Golden Honey",
        description: "Raw, unfiltered wildflower honey harvested this spring.",
        price: 12.0,
        unit: "500g jar",
        quantity: 20,
        category: "other",
        location: "Bee Haven",
        image_url: "https://images.unsplash.com/photo-1587049633562-ad3002f23694?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Crisp Fuji Apples",
        description: "Sweet and crunchy apples, perfect for snacking or baking.",
        price: 3.5,
        unit: "kg",
        quantity: 75,
        category: "fruits",
        location: "Apple Orchard Ridge",
        image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Organic Spinach",
        description: "Deep green, tender spinach leaves packed with nutrients.",
        price: 1.8,
        unit: "bunch",
        quantity: 40,
        category: "vegetables",
        location: "Leafy Greens Farm",
        image_url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=1000&auto=format&fit=crop"
    }
];

const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': apiKey,
    'Content-Type': 'application/json'
};

async function seed() {
    console.log(`Seeding ${sampleProducts.length} products for Farmer ID: ${farmerId}...`);

    for (const product of sampleProducts) {
        const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/products/documents`;
        const body = {
            documentId: 'unique()',
            data: {
                ...product,
                farmer_id: farmerId,
                is_available: true
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (response.ok) {
                console.log(`[SUCCESS] Seeded: ${product.name}`);
            } else {
                const error = await response.json();
                console.error(`[FAILED] ${product.name}: ${error.message}`);
            }
        } catch (e) {
            console.error(`[ERROR] ${product.name}: ${e.message}`);
        }
    }
    console.log("Seeding complete!");
}

seed();
