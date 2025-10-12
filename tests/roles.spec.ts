import { test, expect } from '@playwright/test';

test.describe('Role-based Access Control E2E', () => {
  let userToken: string;
  let adminToken: string;
  let moderatorToken: string;

  test.beforeAll(async ({ request }) => {
    // Create regular user
    const userResponse = await request.post('/users', {
      data: {
        name: 'Regular User',
        email: `user-${Date.now()}@example.com`,
        password: '123456',
        role: 'user',
      },
    });

    expect(userResponse.status()).toBe(201);
    const userBody = await userResponse.json();
    userToken = userBody.data.data.access_token;

    // Create admin user
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

    // Create moderator user
    const moderatorResponse = await request.post('/users', {
      data: {
        name: 'Moderator User',
        email: `moderator-${Date.now()}@example.com`,
        password: '123456',
        role: 'moderator',
      },
    });

    expect(moderatorResponse.status()).toBe(201);
    const moderatorBody = await moderatorResponse.json();
    moderatorToken = moderatorBody.data.data.access_token;
  });

  test.describe('User Management (Admin Only)', () => {
    test('should allow admin to get all users', async ({ request }) => {
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

    test('should deny regular user access to get all users', async ({ request }) => {
      const response = await request.get('/users', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.status()).toBe(403);
    });

    test('should deny moderator access to get all users', async ({ request }) => {
      const response = await request.get('/users', {
        headers: {
          Authorization: `Bearer ${moderatorToken}`,
        },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe('Product Management', () => {
    test('should allow admin to create products', async ({ request }) => {
      const response = await request.post('/products', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          name: 'Admin Product',
          description: 'Product created by admin',
          price: 100,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.data.name).toBe('Admin Product');
    });

    test('should allow moderator to create products', async ({ request }) => {
      const response = await request.post('/products', {
        headers: {
          Authorization: `Bearer ${moderatorToken}`,
        },
        data: {
          name: 'Moderator Product',
          description: 'Product created by moderator',
          price: 200,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.data.name).toBe('Moderator Product');
    });

    test('should deny regular user to create products', async ({ request }) => {
      const response = await request.post('/products', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          name: 'User Product',
          description: 'Product created by user',
          price: 50,
        },
      });

      expect(response.status()).toBe(403);
    });

    test('should allow all authenticated users to view products', async ({ request }) => {
      // Test user access
      const userResponse = await request.get('/products', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      expect(userResponse.status()).toBe(200);

      // Test moderator access
      const moderatorResponse = await request.get('/products', {
        headers: {
          Authorization: `Bearer ${moderatorToken}`,
        },
      });
      expect(moderatorResponse.status()).toBe(200);

      // Test admin access
      const adminResponse = await request.get('/products', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      expect(adminResponse.status()).toBe(200);
    });
  });
});
