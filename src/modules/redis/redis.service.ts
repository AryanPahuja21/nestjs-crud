import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly defaultTTL: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.defaultTTL = this.configService.get<number>('redis.ttl') || 300;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const result = await this.cacheManager.get<T>(key);
    return result !== undefined ? result : null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, (ttl || this.defaultTTL) * 1000);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    // This is a simplified version - for production, you might want to use Redis SCAN
    // to avoid blocking the Redis server with large datasets
    const keys = await this.getKeys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.del(key)));
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null && value !== undefined;
  }

  /**
   * Increment a counter (useful for rate limiting)
   */
  async incr(key: string, ttl?: number): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + 1;
    await this.set(key, newValue, ttl);
    return newValue;
  }

  /**
   * Get keys matching a pattern (use with caution in production)
   */
  private async getKeys(pattern: string): Promise<string[]> {
    // This is a simplified implementation
    // In production, you should use Redis SCAN command for better performance
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const store = (this.cacheManager as any).store as {
        keys?: (pattern: string) => Promise<string[]>;
      };
      if (store?.keys) {
        return await store.keys(pattern);
      }
      return [];
    } catch (error) {
      console.warn('Failed to get keys:', (error as Error).message);
      return [];
    }
  }

  /**
   * Flush all cache
   */
  async reset(): Promise<void> {
    try {
      // Use store's clear method if available, otherwise clear individual keys
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const store = (this.cacheManager as any).store;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (store && typeof store.clear === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await store.clear();
      } else {
        console.warn('Cache reset not supported by this store');
      }
    } catch (error) {
      console.warn('Failed to reset cache:', (error as Error).message);
    }
  }
}
