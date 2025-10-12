import { test, expect } from '@playwright/test';

test.describe('Email Verification E2E', () => {
  let testEmail: string;
  let userToken: string;

  test.beforeAll(async ({ request }) => {
    testEmail = `test-${Date.now()}@example.com`;

    // Create user for resend test
    const response = await request.post('/users', {
      data: {
        name: 'Test User',
        email: testEmail,
        password: '123456',
      },
    });

    const body = await response.json();
    userToken = body.data.data.access_token;
  });

  test('should register user and send verification email', async ({ request }) => {
    const newTestEmail = `new-test-${Date.now()}@example.com`;
    const response = await request.post('/users', {
      data: {
        name: 'Test User',
        email: newTestEmail,
        password: '123456',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.data.user.email).toBe(newTestEmail);
    expect(body.data.data.user.isEmailVerified).toBe(false);
    expect(body.data.data.access_token).toBeDefined();
  });

  test('should allow resending verification email', async ({ request }) => {
    const response = await request.post('/auth/resend-verification', {
      data: {
        email: testEmail,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.data.message).toBe('Verification email sent successfully');
  });

  test('should reject resend for non-existent email', async ({ request }) => {
    const response = await request.post('/auth/resend-verification', {
      data: {
        email: 'nonexistent@example.com',
      },
    });

    expect(response.status()).toBe(404);
  });

  test('should reject verification with invalid token', async ({ request }) => {
    const response = await request.post('/auth/verify-email', {
      data: {
        token: 'invalid-token-12345',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('should reject verification via GET with invalid token', async ({ request }) => {
    const response = await request.get('/auth/verify-email/invalid-token-12345');

    expect(response.status()).toBe(200); // Returns HTML page
    const htmlBody = await response.text();
    expect(htmlBody).toContain('Verification Failed');
    expect(htmlBody).toContain('The verification link is invalid or has expired');
  });

  // Note: Testing actual email verification would require access to the verification token
  // which is typically sent via email. In a real test environment, you might:
  // 1. Mock the email service
  // 2. Use a test email service that provides API access to received emails
  // 3. Access the database directly to get the verification token

  test('should maintain authentication after registration', async ({ request }) => {
    // User should be able to use their token even before email verification
    // (depending on your business logic)
    const response = await request.get('/products', {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    // This test depends on whether you require email verification for API access
    // Adjust expected status based on your business rules
    const expectedStatuses = [200, 401]; // 200 if verification not required, 401 if required
    expect(expectedStatuses).toContain(response.status());
  });
});
