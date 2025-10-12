import { test, expect } from '@playwright/test';

test.describe('App E2E', () => {
  test('should return Hello World on root route', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBe('Hello World!');
  });
});
