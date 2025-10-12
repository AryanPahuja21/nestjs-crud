import { test, expect } from '@playwright/test';

test.describe('Products E2E', () => {
  let adminToken: string;
  let userToken: string;

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

    // Create regular user for testing
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
  });

  test.describe('POST /products', () => {
    test('should create a product with admin token', async ({ request }) => {
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
      expect(body.data.data).toHaveProperty('_id');
      expect(body.data.data.name).toBe('MacBook Pro');
      expect(body.data.data.price).toBe(2500);
    });

    test('should reject unauthenticated requests', async ({ request }) => {
      const response = await request.post('/products', {
        data: {
          name: 'Laptop',
          description: 'High-end laptop',
          price: 2000,
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should reject regular user requests', async ({ request }) => {
      const response = await request.post('/products', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          name: 'Laptop',
          description: 'High-end laptop',
          price: 2000,
        },
      });

      expect(response.status()).toBe(403);
    });

    test('should fail validation for missing fields', async ({ request }) => {
      const response = await request.post('/products', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          name: 'Invalid Product',
          // missing description and price
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /products', () => {
    test('should return products array for authenticated user', async ({ request }) => {
      const response = await request.get('/products', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    test('should reject unauthenticated GET requests', async ({ request }) => {
      const response = await request.get('/products');
      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /products/:id', () => {
    let productId: string;

    test.beforeAll(async ({ request }) => {
      // Create a product to test with
      const createResponse = await request.post('/products', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          name: 'Test Product',
          description: 'Product for testing',
          price: 100,
        },
      });

      const createBody = await createResponse.json();
      productId = createBody.data.data._id;
    });

    test('should return product by ID for authenticated user', async ({ request }) => {
      const response = await request.get(`/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.data._id).toBe(productId);
      expect(body.data.data.name).toBe('Test Product');
    });

    test('should reject unauthenticated requests', async ({ request }) => {
      const response = await request.get(`/products/${productId}`);
      expect(response.status()).toBe(401);
    });
  });
});
