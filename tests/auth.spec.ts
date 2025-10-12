import { test, expect } from '@playwright/test';

test.describe('Auth E2E', () => {
  let testEmail: string;
  let adminToken: string;
  let userToken: string;

  test.beforeAll(async () => {
    testEmail = `aryan-${Date.now()}@example.com`;
  });

  test('should register a new user and return JWT token', async ({ request }) => {
    const response = await request.post('/users', {
      data: {
        name: 'Aryan',
        email: testEmail,
        password: '123456',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.data.user.email).toBe(testEmail);
    expect(body.data.data.access_token).toBeDefined();
    expect(typeof body.data.data.access_token).toBe('string');

    userToken = body.data.data.access_token;
  });

  test('should login and return a JWT token', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: testEmail,
        password: '123456',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.data.access_token).toBeDefined();
    expect(typeof body.data.data.access_token).toBe('string');
  });

  test('should create admin user for protected routes', async ({ request }) => {
    const adminEmail = `admin-${Date.now()}@example.com`;
    const response = await request.post('/users', {
      data: {
        name: 'Admin',
        email: adminEmail,
        password: '123456',
        role: 'admin',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.data.data.user.role).toBe('admin');
    adminToken = body.data.data.access_token;
  });

  test('should access protected route with admin token', async ({ request }) => {
    const response = await request.post('/products', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        name: 'MacBook Pro',
        description: 'High-end laptop',
        price: 2500,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.data.name).toBe('MacBook Pro');
    expect(body.data.data.price).toBe(2500);
  });

  test('should reject unauthorized access to protected routes', async ({ request }) => {
    const response = await request.post('/products', {
      data: {
        name: 'Unauthorized Product',
        description: 'Should not be created',
        price: 100,
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should reject non-admin access to admin routes', async ({ request }) => {
    const response = await request.post('/products', {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      data: {
        name: 'User Product',
        description: 'Should not be created by user',
        price: 100,
      },
    });

    expect(response.status()).toBe(403);
  });
});
