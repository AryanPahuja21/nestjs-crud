import { test, expect } from '@playwright/test';

test.describe('Users E2E', () => {
  let adminToken: string;
  let createdUserId: number;

  test.beforeAll(async ({ request }) => {
    // Create admin user for testing
    const adminResponse = await request.post('/users', {
      data: {
        name: 'Admin User',
        email: `admin-${Date.now()}@example.com`,
        password: '123456',
        role: 'admin',
      },
    });

    expect(adminResponse.status()).toBe(201);
    const adminBody = await adminResponse.json();
    adminToken = adminBody.data.data.access_token;
    createdUserId = adminBody.data.data.user.id;
  });

  test.describe('POST /users', () => {
    test('should create a user and return JWT token', async ({ request }) => {
      const response = await request.post('/users', {
        data: {
          name: 'Test User',
          email: `user-${Date.now()}@example.com`,
          password: '123456',
          role: 'admin',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.data).toHaveProperty('user');
      expect(body.data.data).toHaveProperty('access_token');
      expect(body.data.data.user).toHaveProperty('id');
      expect(body.data.data.user.name).toBe('Test User');
      expect(body.data.data.user).not.toHaveProperty('password'); // Password should not be in response
      expect(body.data.data.user.role).toBe('admin');
      expect(typeof body.data.data.access_token).toBe('string');
    });

    test('should create a regular user with default role', async ({ request }) => {
      const response = await request.post('/users', {
        data: {
          name: 'Regular User',
          email: `regular-${Date.now()}@example.com`,
          password: '123456',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.data.data.user.role).toBe('user'); // Default role
    });

    test('should fail validation for missing fields', async ({ request }) => {
      const response = await request.post('/users', {
        data: { email: 'invalid' },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /users', () => {
    test('should return users array for admin', async ({ request }) => {
      const response = await request.get('/users', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    test('should reject unauthenticated GET requests', async ({ request }) => {
      const response = await request.get('/users');
      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /users/:id', () => {
    test('should return user by ID for admin', async ({ request }) => {
      const response = await request.get(`/users/${createdUserId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.data.id).toBe(createdUserId);
    });

    test('should reject unauthenticated requests', async ({ request }) => {
      const response = await request.get(`/users/${createdUserId}`);
      expect(response.status()).toBe(401);
    });
  });
});
