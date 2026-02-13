# Error Monitoring Setup Guide

## Recommended Tools

### 1. Sentry (Recommended)
Best for error tracking and performance monitoring.

**Setup:**
```bash
npm install @sentry/react @sentry/vite-plugin
```

**Configuration** (`src/main.tsx`):
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
```

**Error Boundaries:**
```typescript
import { ErrorBoundary } from "@sentry/react";

<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

---

### 2. LogRocket
Best for session replay and user behavior tracking.

**Setup:**
```bash
npm install logrocket
```

**Configuration:**
```typescript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');

// Identify users
LogRocket.identify(userId, {
  name: user.name,
  email: user.email,
});
```

---

### 3. Convex Error Logging

**Create error logging mutation** (`convex/errorLogs.ts`):
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logError = mutation({
  args: {
    message: v.string(),
    stack: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    context: v.optional(v.string()),
    severity: v.string(), // "error", "warning", "info"
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("error_logs", {
      ...args,
      timestamp: Date.now(),
      userAgent: args.context,
    });
  },
});
```

**Add to schema** (`convex/schema.ts`):
```typescript
error_logs: defineTable({
  message: v.string(),
  stack: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  context: v.optional(v.string()),
  severity: v.string(),
  timestamp: v.number(),
  userAgent: v.optional(v.string()),
})
  .index("by_severity", ["severity"])
  .index("by_timestamp", ["timestamp"])
  .index("by_userId", ["userId"]),
```

---

## Frontend Error Handling

**Global Error Handler** (`src/utils/errorHandler.ts`):
```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function useErrorHandler() {
  const logError = useMutation(api.errorLogs.logError);

  return (error: Error, context?: string) => {
    console.error(error);
    
    // Log to Convex
    logError({
      message: error.message,
      stack: error.stack,
      context,
      severity: "error",
    });

    // Show user-friendly message
    toast.error("Something went wrong. Our team has been notified.");
  };
}
```

**React Error Boundary:**
```typescript
import React from 'react';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## Backend Error Handling

**Convex Mutation Wrapper:**
```typescript
export function withErrorHandling<T>(
  handler: (ctx: any, args: any) => Promise<T>
) {
  return async (ctx: any, args: any) => {
    try {
      return await handler(ctx, args);
    } catch (error) {
      // Log error
      await ctx.db.insert("error_logs", {
        message: error.message,
        stack: error.stack,
        severity: "error",
        timestamp: Date.now(),
      });
      
      // Re-throw for client
      throw error;
    }
  };
}
```

---

## Monitoring Dashboard

**Query for error stats:**
```typescript
export const getErrorStats = query({
  args: {},
  handler: async (ctx) => {
    const last24h = Date.now() - 86400000;
    
    const errors = await ctx.db
      .query("error_logs")
      .filter((q) => q.gte(q.field("timestamp"), last24h))
      .collect();

    return {
      total: errors.length,
      bySeverity: {
        error: errors.filter(e => e.severity === "error").length,
        warning: errors.filter(e => e.severity === "warning").length,
      },
      topErrors: errors
        .reduce((acc, e) => {
          acc[e.message] = (acc[e.message] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
    };
  },
});
```

---

## Alerts & Notifications

**Set up alerts for critical errors:**
1. Configure Sentry alerts for error rate spikes
2. Set up Slack/Discord webhooks for critical errors
3. Create admin dashboard to view error logs

**Example Slack notification:**
```typescript
async function notifySlack(error: Error) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Critical Error: ${error.message}`,
      attachments: [{
        color: 'danger',
        fields: [{
          title: 'Stack Trace',
          value: error.stack?.slice(0, 500),
        }],
      }],
    }),
  });
}
```

---

## Best Practices

1. **Don't log sensitive data**: Never log passwords, API keys, or PII
2. **Rate limit error logging**: Prevent error log spam
3. **Add context**: Include user ID, page, action when logging
4. **Set up alerts**: Get notified of critical errors immediately
5. **Review regularly**: Check error logs weekly
6. **Clean up old logs**: Archive logs older than 90 days

---

## Quick Start Checklist

- [ ] Install Sentry or LogRocket
- [ ] Add error_logs table to schema
- [ ] Create error logging mutation
- [ ] Add global error handler
- [ ] Implement error boundaries
- [ ] Set up error dashboard
- [ ] Configure alerts
- [ ] Test error logging
