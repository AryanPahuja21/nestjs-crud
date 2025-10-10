import { User } from '../../../database/entities/user.entity';
import {
  ApiSuccessResponse,
  ListResponse,
  ItemResponse,
  DeleteResponse,
} from '../../../types/response.types';

// User without sensitive information (for responses)
export interface SafeUser extends Omit<User, 'password'> {}

// User registration response - includes JWT token
export type UserRegistrationResponse = ApiSuccessResponse<{
  user: SafeUser;
  access_token: string;
}>;

// Standard user responses
export type UserListResponse = ListResponse<SafeUser>;
export type UserItemResponse = ItemResponse<SafeUser>;
export type UserDeleteResponse = DeleteResponse;

// User update response
export type UserUpdateResponse = ItemResponse<SafeUser>;

// User creation response (without token - for admin creation)
export type UserCreateResponse = ItemResponse<SafeUser>;
