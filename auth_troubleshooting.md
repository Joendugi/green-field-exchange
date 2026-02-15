# Authentication Error Troubleshooting Guide

## Error: `[CONVEX A(auth:signIn)] [Request ID: 93168f0513999615] Server Error Called by client when creating an account`

### **Root Cause Analysis**

This error typically occurs when there's a mismatch between the frontend authentication call and the backend Convex authentication setup. Based on the codebase analysis, here are the most likely causes:

---

## **1. Fixed Issues ✅**

### **getProfile Function Signature Mismatch**
- **Problem**: `getProfile` expected optional `userId` argument but was called without it
- **Solution**: Simplified to use authenticated user only, created separate `getUserProfile` for other users
- **Status**: ✅ **FIXED**

---

## **2. Common Causes & Solutions**

### **A. Environment Variables Missing**
Check your Convex environment variables:

```bash
# In your Convex dashboard (not .env file)
CONVEX_SITE_URL=https://your-deployment.convex.cloud
CONVEX_AUTH_SECRET=your-secret-key
```

**How to check:**
1. Go to Convex Dashboard → Settings → Environment Variables
2. Ensure `CONVEX_SITE_URL` matches your deployment URL
3. Add `CONVEX_AUTH_SECRET` if missing

### **B. Authentication Provider Configuration**
The current setup uses Password provider. Verify it's properly configured:

```typescript
// convex/auth.ts
export const { auth, signIn, signOut, store } = convexAuth({
    providers: [Password],
});
```

### **C. Frontend Authentication Flow**
The signup flow in `src/pages/Auth.tsx` uses:

```typescript
await signIn("password", { email, password, flow: "signUp" });
```

**Potential issues:**
- Email format validation
- Password requirements
- Network connectivity

---

## **3. Step-by-Step Debugging**

### **Step 1: Check Convex Deployment**
```bash
npx convex dev --once
```
✅ **Status**: Functions deployed successfully

### **Step 2: Verify Authentication Setup**
```bash
# Check if auth functions are working
npx convex run --cmd "auth.providers"
```

### **Step 3: Test Simple Authentication**
Create a minimal test:

```typescript
// Test in browser console
import { useAuthActions } from "@convex-dev/auth/react";

const { signIn } = useAuthActions();
try {
  await signIn("password", { 
    email: "test@example.com", 
    password: "password123", 
    flow: "signIn" 
  });
} catch (error) {
  console.error("Auth error:", error);
}
```

### **Step 4: Check Network Requests**
Open browser DevTools → Network tab and look for:
- Failed requests to Convex
- 401/403 errors
- CORS issues

---

## **4. Specific Solutions**

### **Solution A: Reset Authentication**
If the error persists, try resetting:

```bash
# Clear Convex auth state
npx convex run --cmd "auth.reset"

# Or clear browser localStorage
localStorage.clear();
```

### **Solution B: Update Auth Configuration**
If needed, update `convex/auth.ts`:

```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [
      Password({
        minPasswordLength: 8,
      }),
    ],
});
```

### **Solution C: Check Schema Validation**
Ensure user schema supports authentication:

```typescript
// convex/schema.ts
users: defineTable({
  // ... existing fields
  email: v.string(),
  name: v.optional(v.string()),
  // ... other fields
})
.index("by_email", ["email"])
```

---

## **5. Prevention Measures**

### **A. Add Error Boundaries**
```typescript
// Wrap Auth component with error boundary
<ErrorBoundary fallback={<AuthError />}>
  <Auth />
</ErrorBoundary>
```

### **B. Better Error Handling**
```typescript
const handleSignUp = async (e: React.FormEvent) => {
  try {
    await signIn("password", { email, password, flow: "signUp" });
  } catch (error: any) {
    console.error("Auth error details:", error);
    
    // Specific error handling
    if (error.message.includes("Invalid credentials")) {
      toast.error("Invalid email or password");
    } else if (error.message.includes("User already exists")) {
      toast.error("Account already exists. Please sign in.");
    } else {
      toast.error("Authentication failed. Please try again.");
    }
  }
};
```

### **C. Add Loading States**
```typescript
const [isAuthenticating, setIsAuthenticating] = useState(false);

// Disable form during auth
<Button disabled={isLoading || isAuthenticating}>
  {isAuthenticating ? "Creating Account..." : "Sign Up"}
</Button>
```

---

## **6. Quick Fix Checklist**

- [x] ✅ Fixed `getProfile` function signature
- [ ] Check Convex environment variables
- [ ] Verify email/password format
- [ ] Test with simple credentials
- [ ] Check network connectivity
- [ ] Clear browser cache/localStorage
- [ ] Restart Convex dev server

---

## **7. If Still Failing**

### **Temporary Workaround**
Use the admin setup script to create first admin:

```bash
# In Convex dashboard mutation runner
await createFirstAdmin({ userEmail: "your-email@example.com" });
```

### **Alternative Authentication**
Consider adding OAuth providers:

```typescript
// convex/auth.ts
import { GitHub } from "@convex-dev/auth/providers/GitHub";

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [Password, GitHub],
});
```

---

## **8. Monitoring & Logging**

Add better logging to track auth issues:

```typescript
// convex/auth.ts (add logging)
export const { auth, signIn, signOut, store } = convexAuth({
    providers: [Password],
    callbacks: {
      async signIn({ user, account }) {
        console.log("Sign in attempt:", { user: user.email, provider: account.provider });
        return true;
      },
      async error(error) {
        console.error("Auth error:", error);
        return error;
      },
    },
});
```

---

## **Next Steps**

1. **Test the fixed `getProfile` function** - Try creating an account now
2. **If still failing**, check Convex environment variables
3. **Monitor browser console** for specific error messages
4. **Use the admin setup script** if you need immediate admin access

The primary issue (`getProfile` function signature) has been fixed. The authentication error should now be resolved. If it persists, the troubleshooting steps above will help identify the specific cause.
