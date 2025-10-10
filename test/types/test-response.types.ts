import { Role } from '../../src/common/enums/role.enum';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface UserWithTokenResponse {
  user: UserResponse;
  access_token: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface ProductResponse {
  _id: string;
  name: string;
  description: string;
  price: number;
}

export interface TestResponse<T = any> {
  status: number;
  body: T;
}
