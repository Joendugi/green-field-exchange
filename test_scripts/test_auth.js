// Test authentication and product creation
import { ConvexHttpClient } from "convex/browser";

async function testAuthAndProduct() {
  const convex = new ConvexHttpClient("https://precise-dragon-817.convex.cloud");
  
  try {
    console.log("Testing authentication...");
    
    // First try to get user profile (requires auth)
    const profile = await convex.query("users:getProfile", {});
    console.log("User profile:", profile);
    
    if (!profile) {
      console.log("❌ No authenticated user found. Please sign in first.");
      return;
    }
    
    console.log("✅ User authenticated:", profile.userId);
    
    // Now try product creation
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
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

testAuthAndProduct();
