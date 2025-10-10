import {
  ApiSuccessResponse,
  ApiErrorResponse,
  DeleteResponse,
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
