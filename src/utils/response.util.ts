import {
  ApiSuccessResponse,
  ApiErrorResponse,
  DeleteResponse,
  PaginationMeta,
  ApiPaginatedResponse,
  HttpStatusCode,
} from '../types/response.types';

/**
 * Builds a standardized success response
 * @param data - The data to include in the response
 * @returns Standardized success response
 */
export function buildSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Builds a standardized error response
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param error - Optional error type/category
 * @param details - Optional additional error details
 * @returns Standardized error response
 */
export function buildErrorResponse(
  message: string,
  statusCode: HttpStatusCode,
  error?: string,
  details?: unknown,
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    timestamp: new Date().toISOString(),
    statusCode,
    message,
  };

  if (error) {
    response.error = error;
  }

  if (details) {
    response.details = details;
  }

  return response;
}

/**
 * Builds a standardized delete response
 * @param message - Success message
 * @param deletedId - ID of the deleted item
 * @returns Standardized delete response
 */
export function buildDeleteResponse(message: string, deletedId: string | number): DeleteResponse {
  return buildSuccessResponse({
    message,
    deletedId,
  });
}

/**
 * Builds a paginated response
 * @param data - Array of items
 * @param meta - Pagination metadata
 * @returns Paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
): ApiPaginatedResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
    meta,
  };
}

/**
 * Calculates pagination metadata
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
