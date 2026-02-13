---
description: How to deploy the AgriLink application to production
---

This workflow guides you through deploying both the backend (Convex) and frontend (Vite) of AgriLink.

## 1. Deploy the Backend (Convex)
Promote your local Convex environment to production.
// turbo
1. Run: `npx convex deploy`
   - This will push your schema, functions, and indexes to the production Convex environment.
   - Note the **Production Convex URL** provided at the end.

## 2. Deploy the Frontend
Configure your hosting provider (e.g., Vercel, Netlify) with the following.

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Environment Variables**:
   - Set `VITE_CONVEX_URL` to the **Production Convex URL** you noted in step 1.

## 3. Verify Deployment
Once the frontend build is complete:
1. Open the production URL.
2. Verify that the social feed and marketplace are loading data from the production database.
3. Test a guest interaction (scrolling, clicking corporate pages).
