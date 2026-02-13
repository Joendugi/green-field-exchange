# Security Tests

## Setup

Install test dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest
```

## Running Tests

```bash
# Run all tests
npm test

# Run security tests only
npm run test:security

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Test Structure

- `security.test.ts` - Security validation tests
  - Input validation
  - Authorization checks
  - Race condition prevention
  - File upload validation
  - Admin security

## Adding Tests

To add actual Convex tests, you'll need to:

1. Set up Convex test client
2. Mock authentication
3. Create test database instances
4. Implement actual mutation/query calls

Example:
```typescript
import { ConvexTestClient } from "convex-test";
import { api } from "../convex/_generated/api";

test("should reject negative prices", async () => {
  const client = new ConvexTestClient();
  
  await expect(
    client.mutation(api.products.create, {
      price: -100,
      // ... other fields
    })
  ).rejects.toThrow("Price must be between");
});
```

## Current Status

The tests are currently placeholders. To make them functional:
- [ ] Install Convex test utilities
- [ ] Set up test database
- [ ] Implement actual test cases
- [ ] Add CI/CD integration
