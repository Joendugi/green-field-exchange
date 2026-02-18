// Test product creation via Convex
import { ConvexHttpClient } from "convex/browser";

async function testProductCreation() {
  const convex = new ConvexHttpClient("https://precise-dragon-817.convex.cloud");
  
  try {
    console.log("Testing product creation...");
    
    const result = await convex.mutation("products:create", {
      name: "Test Product",
      description: "Test product description for debugging",
      price: 25.99,
      quantity: 50,
      unit: "kg",
      category: "vegetables",
      location: "Test Farm",
      image_url: "https://example.com/image.jpg"
    });
    
    console.log("✅ Product created successfully:", result);
    console.log("Product ID:", result);
    
  } catch (error) {
    console.error("❌ Error creating product:", error.message);
    console.error("Full error:", error);
  }
}

testProductCreation();
