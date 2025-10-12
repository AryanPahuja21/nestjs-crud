import { APIRequestContext } from '@playwright/test';

// Type definitions for API responses
interface ApiResponse<T = unknown> {
  success: boolean;
  timestamp: string;
  data: T;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
}

interface AuthResponseData {
  user: UserData;
  access_token: string;
}

interface CreateUserResponse {
  data: AuthResponseData;
}

export class TestHelpers {
  /**
   * Clears Redis cache for clean test state
   */
  static async clearRedisCache(): Promise<void> {
    try {
      // You can add an admin endpoint to clear cache if needed
      // For now, we rely on the disabled rate limiting in test environment
    } catch (error) {
      console.warn('Could not clear Redis cache:', error);
    }
  }

  /**
   * Creates a user and returns the response data
   */
  static async createUser(
    request: APIRequestContext,
    userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
    },
  ): Promise<ApiResponse<CreateUserResponse>> {
    const response = await request.post('/users', {
      data: userData,
    });

    if (response.status() !== 201) {
      const errorBody = await response.text();
      throw new Error(`Failed to create user: ${response.status()} - ${errorBody}`);
    }

    return (await response.json()) as ApiResponse<CreateUserResponse>;
  }

  /**
   * Creates an admin user and returns the token
   */
  static async createAdminUser(
    request: APIRequestContext,
  ): Promise<{ token: string; user: UserData }> {
    const userData = {
      name: 'Admin User',
      email: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
      password: '123456',
      role: 'admin',
    };

    const body = await this.createUser(request, userData);
    return {
      token: body.data.data.access_token,
      user: body.data.data.user,
    };
  }

  /**
   * Creates a regular user and returns the token
   */
  static async createRegularUser(
    request: APIRequestContext,
  ): Promise<{ token: string; user: UserData }> {
    const userData = {
      name: 'Regular User',
      email: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
      password: '123456',
      role: 'user',
    };

    const body = await this.createUser(request, userData);
    return {
      token: body.data.data.access_token,
      user: body.data.data.user,
    };
  }

  /**
   * Creates a moderator user and returns the token
   */
  static async createModeratorUser(
    request: APIRequestContext,
  ): Promise<{ token: string; user: UserData }> {
    const userData = {
      name: 'Moderator User',
      email: `moderator-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
      password: '123456',
      role: 'moderator',
    };

    const body = await this.createUser(request, userData);
    return {
      token: body.data.data.access_token,
      user: body.data.data.user,
    };
  }

  /**
   * Creates a product and returns the response data
   */
  static async createProduct(
    request: APIRequestContext,
    token: string,
    productData: {
      name: string;
      description: string;
      price: number;
    },
  ): Promise<ApiResponse<unknown>> {
    const response = await request.post('/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: productData,
    });

    if (response.status() !== 201) {
      throw new Error(`Failed to create product: ${response.status()}`);
    }

    return (await response.json()) as ApiResponse<unknown>;
  }

  /**
   * Login with email and password and return token
   */
  static async login(request: APIRequestContext, email: string, password: string): Promise<string> {
    const response = await request.post('/auth/login', {
      data: { email, password },
    });

    if (response.status() !== 201) {
      throw new Error(`Login failed: ${response.status()}`);
    }

    const body = (await response.json()) as ApiResponse<{ access_token: string }>;
    return body.data.access_token;
  }

  /**
   * Generate a unique email for testing
   */
  static generateTestEmail(prefix = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`;
  }

  /**
   * Wait for a specified amount of time (useful for rate limiting tests)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
