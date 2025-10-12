import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../modules/redis/redis.service';
import { Request, Response } from 'express';

interface RequestWithUser extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
  };
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export const RATE_LIMIT_KEY = 'rate-limit';

// Decorator to set rate limit options
export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor && descriptor.value) {
      // Method decorator
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    } else {
      // Class decorator
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, target);
    }
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Get rate limit options from method or class
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rateLimitOptions) {
      return true; // No rate limiting configured
    }

    // Generate key based on user ID (if authenticated) or IP address
    const identifier = this.getIdentifier(request);
    const windowStart = Math.floor(Date.now() / rateLimitOptions.windowMs);
    const key = `rate_limit:${identifier}:${windowStart}`;

    try {
      // Get current request count
      const currentCount = (await this.redisService.get<number>(key)) || 0;

      if (currentCount >= rateLimitOptions.max) {
        // Rate limit exceeded
        const resetTime = (windowStart + 1) * rateLimitOptions.windowMs;
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

        throw new HttpException(
          {
            success: false,
            message: rateLimitOptions.message || 'Rate limit exceeded. Too many requests.',
            error: 'Rate Limit Exceeded',
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Increment the counter
      await this.redisService.incr(key, Math.ceil(rateLimitOptions.windowMs / 1000));

      // Set headers for client information
      const response = context.switchToHttp().getResponse<Response>();
      const remaining = Math.max(0, rateLimitOptions.max - currentCount - 1);
      const resetTime = (windowStart + 1) * rateLimitOptions.windowMs;

      response.setHeader('X-RateLimit-Limit', rateLimitOptions.max.toString());
      response.setHeader('X-RateLimit-Remaining', remaining.toString());
      response.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // If Redis is down, allow the request to proceed
      console.warn('Rate limiting failed, allowing request:', error);
      return true;
    }
  }

  private getIdentifier(request: RequestWithUser): string {
    // Try to get user ID from JWT payload (set by JWT strategy)
    if (request.user?.userId) {
      return `user:${request.user.userId}`;
    }

    // Fall back to IP address
    const forwarded = request.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : request.socket?.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }
}
