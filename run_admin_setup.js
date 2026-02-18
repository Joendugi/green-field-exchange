// Terminal script to set up first admin
// Usage: node run_admin_setup.js <email>

import { ConvexHttpClient } from "convex/browser";

async function setupFirstAdmin(userEmail) {
  if (!userEmail) {
    console.error("Please provide an email address:");
    console.error("Usage: node run_admin_setup.js <email>");
    process.exit(1);
  }

  try {
    // Read the Convex URL from .env file
    const fs = await import('fs');
    const path = await import('path');
    
    const envPath = path.join(process.cwd(), '.env');
    let convexUrl = process.env.VITE_CONVEX_URL;
    
    if (!convexUrl && fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/VITE_CONVEX_URL=["']?([^"'\s]+)/);
      if (match) {
        convexUrl = match[1].trim();
      }
    }
    
    if (!convexUrl) {
      console.error("❌ VITE_CONVEX_URL not found in environment or .env file");
      process.exit(1);
    }
    
    const convex = new ConvexHttpClient(convexUrl);
    
    console.log(`Setting up admin privileges for: ${userEmail}`);
    console.log(`Using Convex URL: ${convexUrl}`);
    
    const result = await convex.mutation("setup_admin:createFirstAdmin", {
      userEmail: userEmail
    });

    if (result.success) {
      if (result.alreadyAdmin) {
        console.log(`✅ ${userEmail} is already an admin`);
      } else {
        console.log(`✅ Admin privileges granted to ${userEmail}`);
        console.log(`📝 User ID: ${result.userId}`);
      }
    } else {
      console.error("❌ Failed to grant admin privileges");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("not found")) {
      console.log("\n💡 Make sure the user account exists first:");
      console.log("1. Start the app: npm run dev");
      console.log("2. Create an account with the email address");
      console.log("3. Run this script again");
    }
  }
}

// Get email from command line arguments
const userEmail = process.argv[2];
setupFirstAdmin(userEmail);
