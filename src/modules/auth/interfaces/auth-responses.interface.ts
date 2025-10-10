import { ApiSuccessResponse } from '../../../types/response.types';
import { SafeUser } from '../../user/interfaces/user-responses.interface';

// Login response interface
export interface LoginResponse
  extends ApiSuccessResponse<{
    access_token: string;
    user?: SafeUser; // Optional user data in login response
    expires_in?: number; // Token expiration time
  }> {}

// Token refresh response
export interface TokenRefreshResponse
  extends ApiSuccessResponse<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {}

// Logout response
export type LogoutResponse = ApiSuccessResponse<{
  message: string;
}>;

// Password reset response
export type PasswordResetResponse = ApiSuccessResponse<{
  message: string;
  resetTokenSent: boolean;
}>;
