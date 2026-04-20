// Test password reset functionality
import { ConvexHttpClient } from "convex/browser";

async function testPasswordReset() {
  const convex = new ConvexHttpClient("https://precise-dragon-817.convex.cloud");
  
  try {
    console.log("Testing password reset request...");
    
    // Test 1: Request password reset
    const requestResult = await convex.mutation("passwordReset:requestPasswordReset", {
      email: "joemundia138@gmail.com"
    });
    
    console.log("✅ Password reset request result:", requestResult);
    
    // Test 2: Verify token (this would normally come from email)
    // For testing, we'll use a dummy token
    const testToken = "test123token456";
    
    const verifyResult = await convex.query("passwordReset:verifyResetToken", {
      token: testToken
    });
    
    console.log("✅ Token verification result:", verifyResult);
    
    // Test 3: Reset password
    const resetResult = await convex.mutation("passwordReset:resetPassword", {
      token: testToken,
      newPassword: "newTestPassword123"
    });
    
    console.log("✅ Password reset result:", resetResult);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

testPasswordReset();
