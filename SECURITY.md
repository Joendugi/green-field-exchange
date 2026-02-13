# Security Best Practices for AgriLink

## API Key Management

### Immediate Actions Required
1. **Rotate all exposed API keys** from `.env` file
   - GROQ_API_KEY
   - VITE_SUPABASE_PUBLISHABLE_KEY (if sensitive)
   
2. **Move server-side keys to Convex environment variables**
   ```bash
   # In Convex dashboard, add environment variables:
   # GROQ_API_KEY=your_new_key_here
   ```

3. **Update .gitignore** to ensure .env is never committed
   ```
   .env
   .env.local
   .env.*.local
   ```

### Key Rotation Policy
- Rotate API keys every 90 days
- Use different keys for dev/staging/production
- Never share keys in chat, email, or documentation
- Use Convex environment variables for server-side secrets

## Input Validation

All user inputs are now validated for:
- **Numeric ranges**: Prices (0.01-1M), Quantities (0-1M)
- **String lengths**: Names (3-200), Descriptions (10-2000)
- **Enum validation**: Payment types, categories, roles
- **Sanitization**: XSS prevention with `<>` removal

## Authentication

All sensitive endpoints now require authentication:
- File uploads (products, users)
- Order creation
- Product management
- Admin operations

## Rate Limiting

**TODO**: Implement rate limiting using Convex middleware
- Recommended: 10 requests/minute for mutations
- 100 requests/minute for queries
- Stricter limits for admin operations

## File Upload Security

**TODO**: Add file validation
```typescript
// Validate file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Validate file size (5MB max)
if (file.size > 5 * 1024 * 1024) {
  throw new Error('File too large');
}
```

## Monitoring & Logging

**TODO**: Set up monitoring for:
- Failed authentication attempts
- Admin actions (already logged)
- Unusual order patterns
- API errors and exceptions

## Testing

Run security tests regularly:
```bash
# Test input validation
npm run test:security

# Test authorization
npm run test:auth
```

## Incident Response

If a security breach is detected:
1. Immediately rotate all API keys
2. Review admin audit logs
3. Check for unauthorized data access
4. Notify affected users if data was compromised
5. Document the incident and response

## Compliance

- **GDPR**: Implement data export/deletion on request
- **Data Retention**: Define and enforce retention policies
- **Privacy**: Update privacy policy with data usage details
