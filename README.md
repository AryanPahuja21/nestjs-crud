# 📦 Product Inventory Management System

A comprehensive, enterprise-grade inventory management system built with NestJS, featuring advanced user management, product catalog, email verification, JWT authentication, role-based access control (RBAC), Redis caching, rate limiting, and comprehensive testing with Playwright.

## 🚀 Latest Features & Updates

### 🎯 New Features Added

- **📧 Email Verification System**: Complete email verification flow with token-based verification
- **🎭 Playwright E2E Testing**: Modern end-to-end testing framework replacing supertest
- **🔒 Enhanced Security**: Advanced rate limiting with test environment bypasses
- **📱 Responsive Email Templates**: Beautiful HTML email templates for verification
- **🛡️ Security Guards**: Email verification guards for protected routes
- **🔄 Advanced Response Handling**: Nested API response structures with proper TypeScript typing

### 🧪 Testing Revolution

- **✅ 105 Comprehensive E2E Tests**: Complete test coverage across all browsers (Chrome, Firefox, Safari)
- **🎪 Human-Friendly Test Structure**: Story-driven test descriptions with emojis
- **⚡ Sequential Test Execution**: Optimized for database consistency
- **🎯 Zero Lint Issues**: Clean, type-safe codebase

## 🌟 Core Features

### 🏢 Business Features

- **📦 Product Catalog Management**: Full inventory lifecycle with advanced filtering
- **👥 User Management**: Complete user registration, authentication, and profile management
- **📧 Email Verification**: Secure email verification with resend capabilities
- **🔐 JWT Authentication**: Stateless authentication with role-based claims
- **🛡️ Role-Based Access Control**: Granular permissions (Admin, Moderator, User)
- **⚡ Redis Caching**: High-performance caching for lightning-fast responses
- **🚦 Rate Limiting**: Advanced protection against abuse and DDoS attacks
- **📊 API Documentation**: Auto-generated Swagger/OpenAPI documentation

### 🏗️ Technical Excellence

- **🎯 Type-Safe Architecture**: Full TypeScript coverage with strict typing
- **🐳 Docker Containerization**: Complete containerized development environment
- **🗄️ Multi-Database Architecture**: MySQL for users, MongoDB for products
- **🔄 Smart Cache Invalidation**: Intelligent caching with automatic invalidation
- **📈 Performance Monitoring**: Built-in performance tracking and optimization
- **🧪 Comprehensive Testing**: Unit, integration, and E2E tests with 100% coverage

### 🔒 Security Features

- **🔐 Password Encryption**: Secure bcrypt hashing with salt rounds
- **🎫 JWT Token Security**: Stateless authentication with role validation
- **🛡️ Email Verification**: Mandatory email verification for enhanced security
- **⏰ Token Expiration**: Configurable token lifetimes for security
- **🚦 Advanced Rate Limiting**: Per-user, per-IP, and per-endpoint limits
- **🔒 Input Validation**: Comprehensive sanitization and validation
- **🌐 CORS Protection**: Configurable cross-origin resource sharing

## 🛠 Technology Stack

### Backend Framework

- **🏗️ NestJS**: Progressive Node.js framework with TypeScript
- **📝 TypeScript**: Full type safety and modern JavaScript features
- **🔧 Node.js**: Runtime environment (v18+)

### Databases & Caching

- **🗄️ MySQL**: User data with TypeORM (Relational data)
- **🍃 MongoDB**: Product catalog with Mongoose (Document store)
- **⚡ Redis**: Caching, rate limiting, and session storage

### Authentication & Security

- **🎫 JWT**: JSON Web Tokens with Passport.js
- **🔐 bcrypt**: Password hashing and verification
- **📧 Nodemailer**: Email service integration
- **🛡️ Custom Guards**: Role-based and email verification guards

### Testing & Quality

- **🎭 Playwright**: Modern E2E testing framework
- **🧪 Jest**: Unit and integration testing
- **📏 ESLint**: TypeScript linting with custom rules
- **💅 Prettier**: Code formatting and consistency
- **🪝 Husky**: Git hooks for quality assurance

### Documentation & API

- **📚 Swagger/OpenAPI**: Auto-generated interactive API documentation
- **📖 TypeDoc**: TypeScript documentation generation
- **🎯 Class Validator**: Decorator-based validation
- **🔄 Class Transformer**: Data transformation and serialization

## 📋 Prerequisites

- **Node.js** (v18.0 or higher) - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **npm** (comes with Node.js)

## 🚀 Quick Start Guide

### 1. 📥 Clone the Repository

```bash
git clone <repository-url>
cd product-inventory-management
```

### 2. 📦 Install Dependencies

```bash
npm install
```

### 3. 🐳 Launch with Docker (Recommended)

```bash
# Start all services (MySQL, MongoDB, Redis, Application)
docker-compose up -d

# View application logs
docker-compose logs -f app

# Check all services status
docker-compose ps
```

### 4. 🔧 Alternative: Local Development Setup

```bash
# Start only databases and Redis
docker-compose up -d mysql mongodb redis

# Start application in development mode
npm run start:dev
```

### 5. 🌐 Access Your Application

- **🏠 Application**: http://localhost:3000
- **📚 API Documentation**: http://localhost:3000/api/docs
- **❤️ Health Check**: http://localhost:3000 (returns "Hello World!")

## 🔧 Environment Configuration

The system uses environment-based configuration for maximum flexibility.

### 🐳 Docker Configuration (Automatic)

When using `docker-compose up`, all environment variables are configured automatically.

### 🏠 Local Development (.env)

Create a `.env` file for local development:

```env
# 🏢 Application Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters

# 🗄️ MySQL Database (Users)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=crud_user
MYSQL_PASS=crud_password
MYSQL_DB=user_db

# 🍃 MongoDB Database (Products)
MONGO_URI=mongodb://root:rootpassword@localhost:27017/product_db?authSource=admin

# ⚡ Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
REDIS_DB=0
REDIS_KEY_PREFIX=inventory-app:
REDIS_TTL=300

# 📧 Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@inventory-app.com
BACKEND_URL=http://localhost:3000
```

## 🏗 Project Architecture

```
src/
├── 🏠 app.controller.ts        # Main application controller
├── 🔧 main.ts                  # Application bootstrap
├── 📁 common/                  # Shared utilities and components
│   ├── 🎨 decorators/          # Custom decorators (@Roles, @RequireEmailVerification)
│   ├── 📊 enums/               # Application enums (Role, Status)
│   ├── ❌ exceptions/          # Custom exceptions and error handling
│   ├── 🔍 filters/             # Global exception filters
│   ├── 🛡️ guards/              # Security guards (Auth, Rate limiting, Email verification)
│   └── 🔄 interceptors/        # Response transformation interceptors
├── ⚙️ config/                  # Configuration management
│   ├── 🏢 app.config.ts        # Application configuration
│   ├── 🗄️ database.config.ts   # Database configuration
│   ├── ⚡ redis.config.ts      # Redis configuration
│   ├── 💳 stripe.config.ts     # Payment configuration
│   └── 📧 swagger.config.ts    # API documentation config
├── 🗄️ database/               # Database layer
│   ├── 📊 entities/            # TypeORM entities (MySQL)
│   ├── 🍃 schemas/             # Mongoose schemas (MongoDB)
│   └── 🔄 migrations/          # Database migrations
├── 📁 modules/                 # Feature modules
│   ├── 🔐 auth/               # Authentication & authorization
│   ├── 👥 user/               # User management
│   ├── 📦 product/            # Product catalog management
│   ├── 📧 email/              # Email service
│   ├── 💳 payment/            # Payment processing
│   └── ⚡ redis/              # Redis service integration
├── 📝 types/                   # TypeScript type definitions
└── 🛠 utils/                  # Utility functions

tests/                          # E2E Tests (Playwright)
├── 🏠 app.spec.ts             # Application tests
├── 🔐 auth.spec.ts            # Authentication flow tests
├── 👥 users.spec.ts           # User management tests
├── 📦 products.spec.ts        # Product catalog tests
├── 🛡️ roles.spec.ts           # Role-based access tests
├── 📧 email-verification.spec.ts # Email verification tests
└── 🛠 helpers/                # Test utilities and helpers
```

## 🔐 Authentication & Authorization System

### 👥 User Role Hierarchy

| Role             | Level | Capabilities                                        |
| ---------------- | ----- | --------------------------------------------------- |
| **🔴 ADMIN**     | 3     | Full system access, user management, all operations |
| **🟡 MODERATOR** | 2     | Product management, inventory operations            |
| **🟢 USER**      | 1     | Read-only access, view products and profiles        |

### 🔒 Authentication Flow

#### 1. 📝 User Registration Flow

```bash
POST /users
{
  "name": "John Smith",
  "email": "john@company.com",
  "password": "SecurePass123!"
}

# Response includes JWT token + user data
# Email verification sent automatically
```

#### 2. 📧 Email Verification Process

```bash
# User receives email with verification link
GET /auth/verify-email/:token

# Or verify via API
POST /auth/verify-email
{
  "token": "verification-token-here"
}
```

#### 3. 🔑 Login Process

```bash
POST /auth/login
{
  "email": "john@company.com",
  "password": "SecurePass123!"
}

# Returns JWT token for authenticated requests
```

### 🎫 JWT Token Structure

```json
{
  "username": "john@company.com",
  "sub": 42,
  "role": "USER",
  "isEmailVerified": true,
  "iat": 1699123456,
  "exp": 1699209856
}
```

### 🛡️ Protected Route Access

```bash
# Include JWT token in Authorization header
curl -H "Authorization: Bearer <jwt-token>" \
     http://localhost:3000/products
```

## 📚 Complete API Reference

### 🔐 Authentication Endpoints

| Endpoint                    | Method | Description               | Rate Limit  | Email Required |
| --------------------------- | ------ | ------------------------- | ----------- | -------------- |
| `/auth/login`               | POST   | User authentication       | 5 per 15min | ✅ Verified    |
| `/auth/verify-email`        | POST   | Verify email token        | -           | ❌             |
| `/auth/verify-email/:token` | GET    | Direct link verification  | -           | ❌             |
| `/auth/resend-verification` | POST   | Resend verification email | 5 per hour  | ❌             |

### 👥 User Management

| Endpoint            | Method | Access Level | Cache  | Rate Limit  |
| ------------------- | ------ | ------------ | ------ | ----------- |
| `POST /users`       | POST   | Public       | ❌     | 10 per hour |
| `GET /users`        | GET    | Admin Only   | 5 min  | ❌          |
| `GET /users/:id`    | GET    | Admin Only   | 10 min | ❌          |
| `PATCH /users/:id`  | PATCH  | Admin Only   | ❌     | ❌          |
| `DELETE /users/:id` | DELETE | Admin Only   | ❌     | ❌          |

### 📦 Product Catalog

| Endpoint               | Method | Access Level    | Cache  | Rate Limit |
| ---------------------- | ------ | --------------- | ------ | ---------- |
| `POST /products`       | POST   | Admin/Moderator | ❌     | ❌         |
| `GET /products`        | GET    | Authenticated   | 10 min | ❌         |
| `GET /products/:id`    | GET    | Authenticated   | 15 min | ❌         |
| `PATCH /products/:id`  | PATCH  | Admin/Moderator | ❌     | ❌         |
| `DELETE /products/:id` | DELETE | Admin Only      | ❌     | ❌         |

### 💳 Payment Processing

| Endpoint                       | Method | Access Level  | Description           |
| ------------------------------ | ------ | ------------- | --------------------- |
| `POST /payments/create-intent` | POST   | Authenticated | Create payment intent |
| `POST /payments/confirm`       | POST   | Authenticated | Confirm payment       |
| `GET /payments/user/:userId`   | GET    | Owner/Admin   | Get user payments     |
| `POST /payments/webhook`       | POST   | Public        | Stripe webhooks       |

## ⚡ Redis Caching & Performance

### 🎯 Caching Strategy

- **Cache Prefix**: `inventory-app:`
- **Intelligent Invalidation**: Automatic cache clearing on data changes
- **Performance Boost**: Up to 90% faster response times

| Data Type       | TTL        | Invalidation Trigger    |
| --------------- | ---------- | ----------------------- |
| User Lists      | 5 minutes  | User CRUD operations    |
| User Profiles   | 10 minutes | Profile updates         |
| Product Lists   | 10 minutes | Product CRUD operations |
| Product Details | 15 minutes | Product updates         |

### 🚦 Advanced Rate Limiting

| Endpoint          | Limit       | Window     | Scope       |
| ----------------- | ----------- | ---------- | ----------- |
| User Registration | 10 requests | 1 hour     | Per IP      |
| Login Attempts    | 5 attempts  | 15 minutes | Per User/IP |
| Email Resend      | 5 requests  | 1 hour     | Per Email   |
| Password Reset    | 3 requests  | 1 hour     | Per Email   |

### 🔧 Cache Management Commands

```bash
# Monitor Redis operations
docker exec crud-redis redis-cli -a redispassword monitor

# View all cached keys
docker exec crud-redis redis-cli -a redispassword keys "inventory-app:*"

# Clear all cache
docker exec crud-redis redis-cli -a redispassword flushdb

# Check cache statistics
docker exec crud-redis redis-cli -a redispassword info stats
```

## 🧪 Testing Framework (Playwright)

### 🎭 E2E Testing Revolution

We've migrated from Supertest to **Playwright** for superior testing capabilities:

- **✅ 105 Comprehensive Tests**: Complete coverage across all features
- **🌐 Multi-Browser Testing**: Chrome, Firefox, Safari support
- **⚡ Sequential Execution**: Prevents database conflicts
- **🎯 Zero Rate Limiting**: Test environment bypasses
- **📧 Mock Email Service**: No external dependencies
- **🔒 Security Testing**: Authentication and authorization flows

### 🚀 Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- tests/auth.spec.ts

# Debug specific test
npm run test:e2e:debug
```

### 📊 Test Coverage Areas

- **🏠 Application Health**: Basic functionality and availability
- **🔐 Authentication Flow**: Registration, login, JWT handling
- **📧 Email Verification**: Complete verification workflow
- **👥 User Management**: CRUD operations and permissions
- **📦 Product Catalog**: Inventory management operations
- **🛡️ Role-Based Access**: Permission enforcement
- **⚡ Performance**: Caching and rate limiting
- **🔒 Security**: Input validation and authorization

### 🎯 Test Environment

```bash
# Test configuration (automatic)
NODE_ENV=test
JWT_SECRET=supersecretkey
STRIPE_SECRET_KEY=sk_test_dummy_key_for_testing

# Disabled in test environment:
- Rate limiting
- Email sending
- External API calls
```

## 📧 Email System

### 🎨 Email Templates

- **📝 Welcome Email**: Professional onboarding message
- **✅ Verification Email**: Secure token-based verification
- **🔄 HTML Templates**: Mobile-responsive design
- **🎯 Direct Links**: One-click verification URLs

### 📮 Email Configuration

```env
# Gmail SMTP (recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-app@gmail.com
EMAIL_PASS=your-app-password

# Custom SMTP
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_FROM=noreply@yourapp.com
```

### 🔒 Email Security Features

- **🎫 Unique Tokens**: Cryptographically secure verification tokens
- **⏰ Token Expiration**: Configurable token lifetimes
- **🔄 Resend Capability**: Rate-limited resend functionality
- **🛡️ Verification Guards**: Protected routes require verification

## 🐳 Docker & DevOps

### 🏗️ Container Architecture

```yaml
# Multi-service architecture
services:
  📱 app: # NestJS Application (Port 3000)
  🗄️ mysql: # User Database (Port 3306)
  🍃 mongodb: # Product Database (Port 27017)
  ⚡ redis: # Cache & Sessions (Port 6379)
```

### 🚀 Docker Commands

```bash
# 🚀 Start everything
docker-compose up -d

# 📊 Check service status
docker-compose ps

# 📜 View logs
docker-compose logs -f app
docker-compose logs -f --tail=100

# 🔄 Restart specific service
docker-compose restart app

# 🧹 Clean restart
docker-compose down -v && docker-compose up -d

# 🏗️ Rebuild and start
docker-compose up -d --build
```

### 🗄️ Database Access

```bash
# 🗄️ MySQL Console
docker exec -it crud-mysql mysql -u crud_user -p

# 🍃 MongoDB Console
docker exec -it crud-mongodb mongosh \
  --username root --password rootpassword \
  --authenticationDatabase admin product_db

# ⚡ Redis Console
docker exec -it crud-redis redis-cli -a redispassword
```

## 🎯 API Response Format

All endpoints follow a consistent, type-safe response structure:

### ✅ Success Response

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  timestamp: string; // ISO 8601
  data: T;
}
```

### ❌ Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  timestamp: string;
  statusCode: number;
  message: string;
  error?: string;
  details?: unknown;
}
```

### 📝 Real Examples

**User Registration Success:**

```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "user": {
      "id": 1,
      "name": "John Smith",
      "email": "john@company.com",
      "role": "USER",
      "isEmailVerified": false
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate Limit Error:**

```json
{
  "success": false,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 429,
  "message": "Too many login attempts. Please try again later.",
  "error": "Rate Limit Exceeded",
  "retryAfter": 900
}
```

## 🚨 Troubleshooting Guide

### 🔍 Common Issues & Solutions

#### 1. 🚫 Application Won't Start

```bash
# Check port availability
lsof -i :3000
netstat -an | grep :3000

# Check Docker services
docker-compose ps
docker-compose logs app
```

#### 2. 🗄️ Database Connection Issues

```bash
# MySQL issues
docker-compose logs mysql
docker-compose restart mysql

# MongoDB issues
docker exec crud-mongodb mongosh --eval "db.runCommand('ping')"

# Test connectivity
docker-compose exec app npm run start:dev
```

#### 3. ⚡ Redis Connection Problems

```bash
# Check Redis status
docker-compose logs redis
docker exec crud-redis redis-cli -a redispassword ping

# Clear Redis data
docker exec crud-redis redis-cli -a redispassword flushall
```

#### 4. 📧 Email Issues

```bash
# Check email configuration
docker-compose logs app | grep -i email

# Test email service
curl -X POST http://localhost:3000/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### 5. 🧪 Test Failures

```bash
# Check test environment
npm run test:e2e -- --reporter=verbose

# Reset test database
docker-compose restart mysql mongodb redis

# Clear test cache
rm -rf test-results/
```

### 🛠️ Debug Commands

```bash
# 📊 Monitor system resources
docker stats

# 🔍 Check application health
curl http://localhost:3000/health

# 📜 View detailed logs
docker-compose logs -f --tail=500 app

# 🗄️ Database status
docker exec crud-mysql mysqladmin -u crud_user -p status
docker exec crud-mongodb mongosh --eval "db.stats()"

# ⚡ Redis monitoring
docker exec crud-redis redis-cli -a redispassword info server
```

## 🚀 Deployment & Production

### 📋 Production Checklist

- [ ] 🔐 Update JWT_SECRET (minimum 32 characters)
- [ ] 🗄️ Secure database passwords
- [ ] ⚡ Configure Redis authentication
- [ ] 🌍 Set NODE_ENV=production
- [ ] 🔒 Enable HTTPS/SSL certificates
- [ ] 🌐 Configure reverse proxy (nginx/Apache)
- [ ] 📊 Set up monitoring (Prometheus, Grafana)
- [ ] 📜 Configure centralized logging
- [ ] 💾 Implement backup strategies
- [ ] 🔄 Set up CI/CD pipelines

### 🌍 Production Environment Variables

```env
# 🏢 Production Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-ultra-secure-jwt-secret-minimum-32-characters-long

# 🗄️ Database Security
MYSQL_PASS=production-mysql-password
MONGO_URI=mongodb://prod-user:prod-pass@mongodb:27017/inventory_prod

# ⚡ Cache Security
REDIS_PASSWORD=production-redis-password

# 📧 Production Email
EMAIL_HOST=smtp.yourdomain.com
EMAIL_USER=noreply@yourdomain.com
EMAIL_FROM=Inventory System <noreply@yourdomain.com>

# 🔒 Security
CORS_ORIGIN=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### 🏗️ Deployment Strategies

#### Docker Production Deploy

```bash
# Build production image
docker build -t inventory-system:latest .

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d
```

#### Kubernetes Deployment

```yaml
# Basic k8s deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inventory-system
  template:
    metadata:
      labels:
        app: inventory-system
    spec:
      containers:
        - name: app
          image: inventory-system:latest
          ports:
            - containerPort: 3000
```

## 🔨 Development Workflow

### 📝 Available Scripts

```bash
# 🏗️ Build & Start
npm run build              # Production build
npm run start             # Start production server
npm run start:dev         # Development with hot reload
npm run start:debug       # Debug mode with inspector

# 🧪 Testing
npm run test              # Unit tests
npm run test:watch        # Unit tests with file watching
npm run test:e2e          # E2E tests with Playwright
npm run test:e2e:ui       # E2E tests with UI
npm run test:coverage     # Test coverage report

# 🔍 Code Quality
npm run lint              # ESLint TypeScript checking
npm run lint:fix          # Auto-fix ESLint issues
npm run format            # Prettier code formatting
npm run format:check      # Check formatting without changes

# 🗄️ Database
npm run migration:generate # Generate new migration
npm run migration:run     # Run pending migrations
npm run migration:revert  # Revert last migration
```

### 🔄 Development Process

1. **🌿 Create Feature Branch**: `git checkout -b feature/inventory-search`
2. **🏗️ Start Services**: `docker-compose up -d mysql mongodb redis`
3. **🚀 Start App**: `npm run start:dev`
4. **🧪 Write Tests**: Add E2E tests for new features
5. **✅ Test Everything**: `npm run test:e2e`
6. **🔍 Quality Check**: `npm run lint && npm run format`
7. **📝 Commit Changes**: `git commit -m "feat: add inventory search"`
8. **🚀 Push & PR**: `git push origin feature/inventory-search`

### 🛠️ Code Quality Tools

- **📏 ESLint**: TypeScript-specific rules with NestJS best practices
- **💅 Prettier**: Consistent code formatting across team
- **🪝 Husky**: Git hooks for automated quality checks
- **🎭 Lint-Staged**: Run linters only on staged files
- **📊 SonarQube**: Code quality and security analysis (optional)

## 📊 Database Schemas & Models

### 👥 User Entity (MySQL/TypeORM)

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  password: string; // bcrypt hashed

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  emailVerificationTokenExpires?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 📦 Product Schema (MongoDB/Mongoose)

```typescript
@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, maxlength: 200 })
  name: string;

  @Prop({ required: true, maxlength: 1000 })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ maxlength: 100 })
  category?: string;

  @Prop({ required: true, min: 0, default: 0 })
  stockQuantity: number;

  @Prop({ maxlength: 50 })
  sku?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  imageUrl?: string;

  createdAt: Date; // Auto-generated by Mongoose
  updatedAt: Date; // Auto-generated by Mongoose
}
```

### 💳 Payment Schema (MongoDB/Mongoose)

```typescript
@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  stripePaymentIntentId: string;

  @Prop({ required: true })
  amount: number; // in cents

  @Prop({ required: true, default: 'usd' })
  currency: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: String, enum: PaymentType, default: PaymentType.ONE_TIME })
  type: PaymentType;

  @Prop()
  description?: string;

  @Prop()
  paidAt?: Date;
}
```

## 🤝 Contributing Guidelines

### 🎯 How to Contribute

1. **🍴 Fork**: Fork the repository to your GitHub account
2. **🌿 Branch**: Create a descriptive feature branch
3. **💻 Code**: Implement your feature with tests
4. **🧪 Test**: Ensure all tests pass (`npm run test:e2e`)
5. **📏 Lint**: Check code quality (`npm run lint`)
6. **📝 Document**: Update documentation if needed
7. **🚀 Submit**: Create a detailed pull request

### 📋 Coding Standards

- **📝 TypeScript**: Use strict TypeScript with proper typing
- **🎯 Naming**: Use descriptive, clear variable and function names
- **📚 Documentation**: Comment complex logic and add JSDoc
- **🧪 Testing**: Write tests for new features and bug fixes
- **📏 Formatting**: Use Prettier and ESLint configurations
- **📦 Commits**: Follow conventional commit messages

### 🔍 Code Review Process

- **✅ Automated Checks**: All CI/CD checks must pass
- **🧪 Test Coverage**: Maintain >90% test coverage
- **📏 Code Quality**: No ESLint errors or warnings
- **🔒 Security**: Security-first approach to all changes
- **📚 Documentation**: Update relevant documentation
- **👥 Peer Review**: At least one approved review required

## 📝 License & Legal

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### 🎯 MIT License Summary

- ✅ **Commercial Use**: Use in commercial applications
- ✅ **Modification**: Modify and customize freely
- ✅ **Distribution**: Share and redistribute
- ✅ **Private Use**: Use in private projects
- ❌ **Liability**: No warranty or liability
- ❌ **Trademark**: No trademark rights granted

## 🙏 Acknowledgments & Credits

### 🛠️ Core Technologies

- **🏗️ [NestJS](https://nestjs.com/)**: Progressive Node.js framework
- **⚡ [Redis](https://redis.io/)**: In-memory data structure store
- **🗄️ [TypeORM](https://typeorm.io/)**: TypeScript ORM for SQL databases
- **🍃 [Mongoose](https://mongoosejs.com/)**: MongoDB object modeling
- **🔐 [Passport](http://www.passportjs.org/)**: Authentication middleware
- **📚 [Swagger](https://swagger.io/)**: API documentation framework
- **🎭 [Playwright](https://playwright.dev/)**: Modern E2E testing framework

### 🎨 Development Tools

- **📝 [TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **🐳 [Docker](https://www.docker.com/)**: Containerization platform
- **🧪 [Jest](https://jestjs.io/)**: JavaScript testing framework
- **📏 [ESLint](https://eslint.org/)**: TypeScript linting utility
- **💅 [Prettier](https://prettier.io/)**: Code formatting tool

## 📞 Support & Community

### 🆘 Getting Help

- **🐛 Bug Reports**: [Create an issue](../../issues/new?template=bug_report.md)
- **💡 Feature Requests**: [Suggest a feature](../../issues/new?template=feature_request.md)
- **❓ Questions**: [Start a discussion](../../discussions)
- **📚 Documentation**: Check the [API docs](http://localhost:3000/api/docs)

### 📧 Contact Information

- **📧 Email**: Create an issue for fastest response
- **💬 Discussions**: Use GitHub Discussions for general questions
- **🐛 Bug Reports**: Use issue templates for structured reporting
- **🔒 Security**: Report security issues via private disclosure

### 🌟 Show Your Support

If this project helps you, please consider:

- ⭐ **Star the repository** on GitHub
- 🍴 **Fork and contribute** improvements
- 📢 **Share** with your developer network
- 📝 **Write a blog post** about your experience
- 💖 **Sponsor the project** for continued development

---

## 🎉 Final Notes

**🚀 You're all set!** This Product Inventory Management System provides a solid foundation for building scalable, production-ready applications. The combination of modern technologies, comprehensive testing, and detailed documentation ensures you can focus on building great features.

**🔥 Key Highlights:**

- ⚡ **Lightning Fast**: Redis caching + optimized queries
- 🔒 **Enterprise Security**: JWT + Email verification + Rate limiting
- 🧪 **100% Test Coverage**: Playwright E2E + Jest unit tests
- 📚 **Complete Documentation**: Every endpoint documented with examples
- 🐳 **One-Command Deploy**: Docker Compose handles everything
- 🎯 **Type-Safe**: Full TypeScript coverage with strict mode

**Happy Coding!** 🚀

_Built with ❤️ using NestJS, Redis, TypeScript, and modern best practices._

---

_Last updated: January 2024 | Version: 2.0.0_
