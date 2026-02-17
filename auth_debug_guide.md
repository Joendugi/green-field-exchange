# Convex Authentication Debugging Guide

## Current Status ✅
- Convex deployment: **SUCCESS** (https://precise-dragon-817.convex.cloud)
- Auth configuration: **FIXED** (Password provider properly configured)
- Environment variables: **SET** (JWKS, JWT_PRIVATE_KEY, etc.)
- getProfile function: **FIXED** (Signature corrected)

---

## Test Account Creation Now

### 1. **Try Creating Account**
Go to your deployed app and try creating a new account:
- URL: `http://localhost:8080` (dev) or your deployed URL
- Click "Sign Up" tab
- Fill in: Email, Password, Full Name, Role
- Submit form

### 2. **Expected Behavior**
- ✅ Account created successfully
- ✅ Profile created automatically
- ✅ Redirected to dashboard
- ✅ No Convex authentication errors

---

## If Error Still Occurs

### **Check Browser Console**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Try creating account
4. Look for specific error messages

### **Common Error Patterns**

#### **A. "Invalid credentials"**
```javascript
// Check: Email format, password strength
if (password.length < 8) {
  // Password too short
}
```

#### **B. "User already exists"**
```javascript
// User with this email already registered
// Try signing in instead
```

#### **C. "Network error"**
```javascript
// Check Convex URL in .env
VITE_CONVEX_URL=https://precise-dragon-817.convex.cloud
```

#### **D. "Server error"**
```javascript
// Check Convex logs
npx convex logs --history 20
```

---

## Manual Testing Steps

### **Step 1: Verify Convex Connection**
```javascript
// In browser console
import { useQuery } from "convex/react";
const { data } = useQuery(api.users.getProfile);
console.log("Profile data:", data);
```

### **Step 2: Test Authentication Directly**
```javascript
// Test signIn function
import { useAuthActions } from "@convex-dev/auth/react";
const { signIn } = useAuthActions();

try {
  await signIn("password", { 
    email: "test@example.com", 
    password: "password123", 
    flow: "signUp" 
  });
  console.log("✅ Sign up successful");
} catch (error) {
  console.error("❌ Sign up failed:", error);
}
```

---

## Environment Verification

### **Frontend (.env)**
```bash
VITE_CONVEX_URL=https://precise-dragon-817.convex.cloud
```

### **Backend (Convex)**
```bash
# Check environment variables
npx convex env list
# Should show: JWT_PRIVATE_KEY, JWKS, etc.
```

---

## Debugging Commands

### **Check Convex Functions**
```bash
# List all functions
npx convex function list

# Test specific function
npx convex run users.getProfile
```

### **Monitor Logs**
```bash
# Real-time logs
npx convex logs --history 50

# Production logs
npx convex logs --prod --history 50
```

### **Check Deployment**
```bash
# Verify deployment status
npx convex deploy --dry-run
```

---

## Common Fixes Applied

### **1. ✅ Fixed getProfile Function**
- Changed from optional userId to authenticated user only
- Added separate getUserProfile for other users

### **2. ✅ Fixed Auth Configuration**
- Simplified Password provider setup
- Removed invalid minPasswordLength config

### **3. ✅ Fixed Environment Setup**
- Convex environment variables properly configured
- Deployment URL correctly set

---

## Quick Test Script

Create a test file `test_auth.js`:
```javascript
// Test authentication flow
async function testAuth() {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        flow: 'signUp'
      })
    });
    
    const result = await response.json();
    console.log('Auth test result:', result);
  } catch (error) {
    console.error('Auth test error:', error);
  }
}

testAuth();
```

---

## Next Steps

1. **Try account creation now** - Should work without errors
2. **If still failing**, check browser console for specific error
3. **Check Convex logs** for detailed error messages
4. **Verify environment variables** match deployment URL

## Success Indicators

✅ No `[CONVEX A(auth:signIn)]` errors  
✅ Account created successfully  
✅ Profile appears in database  
✅ User can sign in/out  
✅ Admin dashboard accessible (for admin users)

---

## Emergency Fallback

If authentication still fails, use the admin setup script:

```bash
# In Convex dashboard mutation runner
await createFirstAdmin({ userEmail: "your-email@example.com" });
```

This bypasses normal auth flow and creates admin directly.

---

**The authentication system should now work correctly. Try creating an account and let me know if you still see any errors!**
