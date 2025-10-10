# Role-Based Access Control (RBAC) Implementation

## Overview

This application now includes a comprehensive role-based access control system that manages user permissions across different endpoints.

## Roles Implemented

### 1. **USER** (Default)

- Can view products (`GET /products`, `GET /products/:id`)
- Cannot create, update, or delete products
- Cannot access user management endpoints

### 2. **MODERATOR**

- All USER permissions
- Can create products (`POST /products`)
- Can update products (`PATCH /products/:id`)
- Cannot delete products
- Cannot access user management endpoints

### 3. **ADMIN**

- All USER and MODERATOR permissions
- Can delete products (`DELETE /products/:id`)
- Full access to user management (`GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`)

## Implementation Details

### Files Created/Modified:

1. **`src/common/enums/role.enum.ts`** - Role enumeration
2. **`src/common/decorators/roles.decorator.ts`** - `@Roles()` decorator
3. **`src/common/guards/roles.guard.ts`** - Role validation guard
4. **`src/database/entities/user.entity.ts`** - Added role field
5. **`src/modules/user/dto/create-user.dto.ts`** - Added optional role field
6. **Updated controllers** - Applied role guards to protected endpoints
7. **Updated JWT strategy** - Include role in token payload
8. **Updated services** - Include role in authentication flow

### Usage Examples:

```typescript
// Admin-only endpoint
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get('users')
findAllUsers() { ... }

// Admin or Moderator endpoint
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Post('products')
createProduct() { ... }

// Any authenticated user
@UseGuards(JwtAuthGuard)
@Get('products')
viewProducts() { ... }
```

### Authentication Flow:

1. User registers with optional role (defaults to USER)
2. JWT token includes user role in payload
3. Protected endpoints validate token and check role permissions
4. Unauthorized access returns 401, forbidden access returns 403

### Testing:

- Comprehensive E2E tests verify role-based access control
- Tests cover all permission combinations
- Unit tests ensure existing functionality remains intact

## Database Migration Note:

When deploying, ensure the user table is updated to include the `role` column. New users will default to the `USER` role.
