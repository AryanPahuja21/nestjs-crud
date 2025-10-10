# 🎯 Response Patterns & TypeScript Guidelines

## 📋 Table of Contents

1. [Response Pattern System](#response-pattern-system)
2. [Type vs Interface Guidelines](#type-vs-interface-guidelines)
3. [Controller Return Types](#controller-return-types)
4. [Best Practices](#best-practices)
5. [Examples](#examples)

## 🏗️ Response Pattern System

### Overview

Our application uses a standardized response pattern to ensure consistent API responses across all endpoints.

### Core Response Structure

```typescript
// Success Response
{
  success: true,
  timestamp: "2023-01-01T00:00:00.000Z",
  data: T // Generic type for actual data
}

// Error Response
{
  success: false,
  timestamp: "2023-01-01T00:00:00.000Z",
  statusCode: 400,
  message: "Error message",
  error?: "Error category",
  details?: unknown // Optional additional details
}
```

### Response Types Hierarchy

```
BaseApiResponse (interface)
├── ApiSuccessResponse<T> (interface)
├── ApiErrorResponse (interface)
└── Various utility types...
```

## 🔄 Type vs Interface Guidelines

### 🟢 Use `interface` when:

#### 1. **Object Shapes & Contracts**

```typescript
// ✅ GOOD: API response contracts
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// ✅ GOOD: Function parameters
interface CreateUserParams {
  name: string;
  email: string;
  role?: Role;
}
```

#### 2. **Extensible Structures**

```typescript
// ✅ GOOD: Base interfaces that will be extended
interface BaseApiResponse {
  success: boolean;
  timestamp: string;
}

interface UserResponse extends BaseApiResponse {
  data: User;
}
```

#### 3. **Implementation Contracts**

```typescript
// ✅ GOOD: Service contracts
interface UserServiceInterface {
  create(dto: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
}
```

### 🔵 Use `type` when:

#### 1. **Union Types**

```typescript
// ✅ GOOD: Union of possible values
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

#### 2. **Computed/Utility Types**

```typescript
// ✅ GOOD: Derived from other types
type SafeUser = Omit<User, 'password'>;
type UserUpdateFields = Partial<Pick<User, 'name' | 'email'>>;
```

#### 3. **Simple Type Aliases**

```typescript
// ✅ GOOD: Simple aliases
type UserID = string | number;
type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;
```

#### 4. **Function Types**

```typescript
// ✅ GOOD: Function signatures
type EventHandler = (event: Event) => void;
type AsyncValidator<T> = (value: T) => Promise<boolean>;
```

### ❌ Avoid These Patterns

```typescript
// ❌ BAD: Using type for extensible objects
type UserResponse = {
  data: User;
  success: boolean;
};

// ❌ BAD: Using interface for unions
interface ResponseType extends ApiSuccessResponse, ApiErrorResponse {} // Won't work

// ❌ BAD: Using interface for primitives
interface UserID extends string {} // Unnecessary complexity
```

## 🎮 Controller Return Types

### Pattern Implementation

```typescript
@Controller('users')
export class UserController {
  // ✅ GOOD: Explicit return types
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserRegistrationResponse> {
    const user = await this.userService.create(dto);
    return buildSuccessResponse({
      user: removePassword(user),
      access_token: this.generateToken(user),
    });
  }

  @Get()
  async findAll(): Promise<UserListResponse> {
    const users = await this.userService.findAll();
    const safeUsers = users.map(removePassword);
    return buildSuccessResponse(safeUsers);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<UserDeleteResponse> {
    await this.userService.remove(id);
    return buildDeleteResponse('User deleted successfully', id);
  }
}
```

### Response Type Naming Convention

```typescript
// Pattern: {Module}{Action}Response
type UserListResponse = ListResponse<SafeUser>;
type UserItemResponse = ItemResponse<SafeUser>;
type UserCreateResponse = ItemResponse<SafeUser>;
type UserUpdateResponse = ItemResponse<SafeUser>;
type UserDeleteResponse = DeleteResponse;

// Special cases
interface UserRegistrationResponse
  extends ApiSuccessResponse<{
    user: SafeUser;
    access_token: string;
  }> {}
```

## 💡 Best Practices

### 1. **Consistent Response Wrapping**

```typescript
// ✅ GOOD: Always use response builders
return buildSuccessResponse(data);
return buildErrorResponse(message, statusCode);
return buildDeleteResponse(message, id);

// ❌ BAD: Manual response construction
return { success: true, data, timestamp: new Date().toISOString() };
```

### 2. **Type Safety in Controllers**

```typescript
// ✅ GOOD: Explicit return types
async findUser(@Param('id') id: number): Promise<UserItemResponse> {
  // TypeScript ensures we return the correct structure
}

// ❌ BAD: No return type
async findUser(@Param('id') id: number) {
  // Could return anything
}
```

### 3. **Generic Response Types**

```typescript
// ✅ GOOD: Reusable generic types
type ListResponse<T> = ApiSuccessResponse<T[]>;
type ItemResponse<T> = ApiSuccessResponse<T>;

// Use them consistently
type ProductListResponse = ListResponse<Product>;
type UserListResponse = ListResponse<SafeUser>;
```

### 4. **Error Handling**

```typescript
// ✅ GOOD: Standardized error responses
throw new BadRequestException('Invalid input'); // Automatically wrapped

// Response will be:
{
  success: false,
  statusCode: 400,
  message: 'Invalid input',
  timestamp: '...'
}
```

### 5. **Swagger Documentation**

```typescript
@ApiResponse({
  status: 200,
  description: 'List of users',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      timestamp: { type: 'string' },
      data: { type: 'array', items: { $ref: '#/components/schemas/User' } }
    }
  }
})
```

## 📚 Examples

### Complete Module Example

```typescript
// interfaces/product-responses.interface.ts
export type ProductListResponse = ListResponse<Product>;
export type ProductItemResponse = ItemResponse<Product>;
export type ProductCreateResponse = ItemResponse<Product>;
export type ProductDeleteResponse = DeleteResponse;

// product.controller.ts
@Controller('products')
export class ProductController {
  @Get()
  async findAll(): Promise<ProductListResponse> {
    const products = await this.productService.findAll();
    return buildSuccessResponse(products);
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductCreateResponse> {
    const product = await this.productService.create(dto);
    return buildSuccessResponse(product);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ProductDeleteResponse> {
    await this.productService.remove(id);
    return buildDeleteResponse('Product deleted successfully', id);
  }
}
```

### Error Response Example

```typescript
// Automatically handled by exception filter
throw new NotFoundException('Product not found');

// Results in:
{
  success: false,
  statusCode: 404,
  message: 'Product not found',
  timestamp: '2023-01-01T00:00:00.000Z'
}
```

## 🔧 Implementation Checklist

- [ ] ✅ Use `interface` for object contracts and extensible structures
- [ ] ✅ Use `type` for unions, utilities, and computed types
- [ ] ✅ Always specify return types in controller methods
- [ ] ✅ Use response builder functions consistently
- [ ] ✅ Follow naming conventions for response types
- [ ] ✅ Remove sensitive data (passwords) from responses
- [ ] ✅ Include proper Swagger documentation
- [ ] ✅ Handle errors through exception filters
- [ ] ✅ Use generic types for reusability
- [ ] ✅ Maintain consistent response structure

## 🚀 Migration Guide

### For Existing Controllers

1. **Add response type imports**
2. **Add explicit return types to methods**
3. **Wrap responses with builder functions**
4. **Update Swagger documentation**
5. **Test response structure**

### Example Migration

```typescript
// Before
@Get()
findAll() {
  return this.userService.findAll();
}

// After
@Get()
async findAll(): Promise<UserListResponse> {
  const users = await this.userService.findAll();
  const safeUsers = users.map(({ password, ...user }) => user as SafeUser);
  return buildSuccessResponse(safeUsers);
}
```

This system ensures type safety, consistency, and maintainability across your entire API! 🎯
