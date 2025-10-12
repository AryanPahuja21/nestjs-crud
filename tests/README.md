# E2E Testing with Playwright

This project now uses Playwright for end-to-end testing instead of supertest. Playwright provides better testing capabilities including cross-browser testing, UI testing, and API testing.

## Setup

Playwright is already installed and configured. The browsers are downloaded automatically when you install dependencies.

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Test Directory**: `./tests/` (changed from `./test/`)
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari (WebKit)
- **Web Server**: Automatically starts the dev server for testing

## Running Tests

### Basic Commands

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

### Specific Test Files

```bash
# Run specific test file
npx playwright test auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "should login"

# Run tests in a specific browser
npx playwright test --project=chromium
```

## Test Structure

### Test Files

- `tests/app.spec.ts` - Basic app functionality
- `tests/auth.spec.ts` - Authentication tests
- `tests/users.spec.ts` - User management tests
- `tests/products.spec.ts` - Product management tests
- `tests/roles.spec.ts` - Role-based access control tests
- `tests/email-verification.spec.ts` - Email verification tests

### Test Helpers

`tests/helpers/test-helpers.ts` contains utility functions for:

- Creating test users (admin, regular, moderator)
- Creating test products
- User authentication
- Generating test emails
- Common test operations

## Key Differences from Supertest

### API Testing

**Before (Supertest):**

```typescript
await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(201);
```

**Now (Playwright):**

```typescript
const response = await request.post('/auth/login', {
  data: { email, password },
});
expect(response.status()).toBe(201);
```

### Authentication

**Before:**

```typescript
.set('Authorization', `Bearer ${token}`)
```

**Now:**

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Response Handling

**Before:**

```typescript
expect(response.body.access_token).toBeDefined();
```

**Now:**

```typescript
const body = await response.json();
expect(body.data.access_token).toBeDefined();
```

## Benefits of Playwright

1. **Cross-browser Testing**: Tests run on Chrome, Firefox, and Safari
2. **Better Debugging**: Visual debugging with `--debug` flag
3. **Test Reports**: HTML reports with screenshots and traces
4. **API + UI Testing**: Can test both APIs and web interfaces
5. **Better Parallelization**: Tests run faster in parallel
6. **Modern Tooling**: Better TypeScript support and developer experience

## Test Environment

Tests automatically:

1. Start the development server (`npm run start:dev`)
2. Wait for the server to be ready
3. Run tests against `http://localhost:3000`
4. Clean up after completion

## Debugging

### Visual Debugging

```bash
# Opens browser and runs tests step by step
npm run test:e2e:debug
```

### Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Migration Notes

- Old supertest tests are kept in the `test/` directory for reference
- New Playwright tests are in the `tests/` directory
- Run `npm run test:e2e` for new tests
- Run `npm test` for unit tests (Jest remains unchanged)

## Best Practices

1. **Use Test Helpers**: Utilize `TestHelpers` for common operations
2. **Clean Test Data**: Each test should create its own test data
3. **Unique Identifiers**: Use timestamps/random strings for unique emails
4. **Proper Assertions**: Use Playwright's expect for better error messages
5. **Test Independence**: Tests should not depend on each other
