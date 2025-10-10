/**
 * Common API Response Types
 *
 * Guidelines:
 * - Use `interface` for object shapes that might be extended or implemented
 * - Use `type` for unions, primitives, or computed types
 * - Use `interface` for function parameters and return types in most cases
 * - Use `type` for utility types and transformations
 */

import { HttpStatus } from '@nestjs/common';

// Base response interface - can be extended by specific responses
export interface BaseApiResponse {
  success: boolean;
  timestamp: string;
  message?: string;
}

// Success response interface - use when operation succeeds
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
  success: true;
  data: T;
}

// Error response interface - use when operation fails
export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  statusCode: number;
  error?: string;
  details?: unknown;
}

// Union type for all possible responses
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Generic message response type - for operations that don't return data
export type MessageResponse = ApiSuccessResponse<{ message: string }>;

// Delete response type - standardized delete confirmation
export type DeleteResponse = ApiSuccessResponse<{
  message: string;
  deletedId: string | number;
}>;

// Common HTTP status codes type
export type HttpStatusCode = HttpStatus | number;

// Generic list response type
export type ListResponse<T> = ApiSuccessResponse<T[]>;

// Generic single item response type
export type ItemResponse<T> = ApiSuccessResponse<T>;
