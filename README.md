# NestJS CRUD Application with Redis Caching

A comprehensive, production-ready CRUD application built with NestJS, featuring user management, product management, JWT authentication, role-based access control (RBAC), Redis caching, and rate limiting.

## 🚀 Features

### Core Features

- **User Management**: Complete CRUD operations for users with JWT token generation
- **Product Management**: Full product lifecycle management with caching
- **JWT Authentication**: Secure token-based authentication with role information
- **Role-Based Access Control (RBAC)**: Fine-grained permission system
- **Redis Caching**: High-performance caching for improved API response times
- **Rate Limiting**: Redis-based rate limiting for security and DDoS protection
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Data Validation**: Comprehensive input validation with class-validator
- **Error Handling**: Centralized exception handling with custom filters
- **Database Support**: Dual database architecture (MySQL + MongoDB)

### Performance Features

- **Smart Caching**: Intelligent cache invalidation on data changes
- **Cache TTL**: Configurable time-to-live for different endpoints
- **Rate Limiting**: Per-user and per-IP rate limiting
- **Connection Pooling**: Optimized database connections

### Security Features

- **Password Hashing**: Secure bcrypt password encryption
- **JWT Tokens**: Stateless authentication with role-based claims
- **Role-Based Guards**: Protect endpoints based on user roles
- **Rate Limiting**: Prevent brute force attacks and abuse
- **Input Sanitization**: Prevent injection attacks with validation pipes
- **CORS Protection**: Configurable cross-origin resource sharing

### Architecture Features

- **Modular Design**: Clean separation of concerns
- **TypeScript**: Full type safety and modern JavaScript features
- **Docker Support**: Containerized development and deployment
- **Environment Configuration**: Flexible config management
- **Standardized Responses**: Consistent API response format with proper TypeScript types
- **Global Exception Handling**: Centralized error management

## 🛠 Tech Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Databases**:
  - MySQL (Users) - with TypeORM
  - MongoDB (Products) - with Mongoose
  - Redis (Caching & Rate Limiting)
- **Authentication**: JWT with Passport
- **Caching**: Redis with @nestjs/cache-manager
- **Rate Limiting**: Redis-based throttling
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose
- **Password Encryption**: bcrypt
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm (comes with Node.js)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nestjs-crud
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start All Services with Docker

```bash
# Start all services (MySQL, MongoDB, Redis, Application)
docker-compose up -d

# View logs
docker-compose logs -f app
```

### 4. Alternative: Start Services Separately

```bash
# Start databases and Redis only
docker-compose up -d mysql mongodb redis

# Start application in development mode
npm run start:dev
```

### 5. Access the Application

- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000 (should return "Hello World!")

## 🔧 Environment Variables

The application uses environment variables for configuration. When using Docker Compose, these are set automatically.

### Docker Environment (docker-compose.yml)

```yaml
# Database Configuration
MYSQL_HOST: mysql
MYSQL_PORT: 3306
MYSQL_USER: crud_user
MYSQL_PASS: crud_password
MYSQL_DB: user_db

MONGO_URI: mongodb://root:rootpassword@mongodb:27017/product_db?authSource=admin

# Redis Configuration
REDIS_HOST: redis
REDIS_PORT: 6379
REDIS_PASSWORD: redispassword
REDIS_DB: 0
REDIS_KEY_PREFIX: crud-app:
REDIS_TTL: 300

# Application Configuration
PORT: 3000
NODE_ENV: production
JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
```

### Local Development (.env)

```env
# Application
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MySQL Configuration (Users)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=crud_user
MYSQL_PASS=crud_password
MYSQL_DB=user_db

# MongoDB Configuration (Products)
MONGO_URI=mongodb://root:rootpassword@localhost:27017/product_db?authSource=admin

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
REDIS_DB=0
REDIS_KEY_PREFIX=crud-app:
REDIS_TTL=300
```

## 🏗 Project Structure

```
src/
├── common/                 # Shared utilities
│   ├── decorators/         # Custom decorators (@Roles)
│   ├── enums/             # Application enums (Role)
│   ├── exceptions/        # Custom exceptions
│   ├── filters/           # Exception filters
│   ├── guards/            # Auth & rate limiting guards
│   └── interceptors/      # Response interceptors
├── config/                # Configuration files
│   ├── app.config.ts      # Application config
│   ├── database.config.ts # Database config
│   └── redis.config.ts    # Redis config
├── database/              # Database configuration
│   ├── entities/          # TypeORM entities (MySQL)
│   └── schemas/           # Mongoose schemas (MongoDB)
├── modules/               # Feature modules
│   ├── auth/              # Authentication module
│   ├── user/              # User management module
│   ├── product/           # Product management module
│   └── redis/             # Redis service module
├── types/                 # TypeScript type definitions
│   └── response.types.ts  # API response types
└── utils/                 # Utility functions
    └── response.util.ts   # Response builders
```

## 🔐 Authentication & Authorization

### User Roles

- **ADMIN**: Full system access (all operations)
- **MODERATOR**: Product management access (create, update products)
- **USER**: Limited read access (view products only)

### Authentication Flow

1. **User Registration**: `POST /users` (returns user data + JWT token)
2. **User Login**: `POST /auth/login` (returns JWT token)
3. **Protected Routes**: Include `Authorization: Bearer <jwt-token>` header

### JWT Token Structure

```json
{
  "username": "user@example.com",
  "sub": 123,
  "role": "USER",
  "iat": 1609459200,
  "exp": 1609462800
}
```

### Example Usage

```bash
# Register a new user (automatically returns JWT token)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login (get JWT token)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Access protected route
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 📚 API Endpoints

### Authentication

- `POST /auth/login` - User login (Rate limited: 5 attempts per 15 minutes)

### Users

- `POST /users` - Create user & get JWT token (Rate limited: 10 per hour per IP)
- `GET /users` - Get all users (Admin only) **[Cached: 5 minutes]**
- `GET /users/:id` - Get user by ID (Admin only) **[Cached: 10 minutes]**
- `PATCH /users/:id` - Update user (Admin only) **[Cache invalidation]**
- `DELETE /users/:id` - Delete user (Admin only) **[Cache invalidation]**

### Products

- `POST /products` - Create product (Admin/Moderator) **[Cache invalidation]**
- `GET /products` - Get all products (Authenticated) **[Cached: 10 minutes]**
- `GET /products/:id` - Get product by ID (Authenticated) **[Cached: 15 minutes]**
- `PATCH /products/:id` - Update product (Admin/Moderator) **[Cache invalidation]**
- `DELETE /products/:id` - Delete product (Admin only) **[Cache invalidation]**

## ⚡ Redis Caching & Performance

### Cache Strategy

- **Cache Keys**: Prefixed with `crud-app:` (configurable)
- **TTL (Time To Live)**:
  - User list: 5 minutes
  - Individual users: 10 minutes
  - Product list: 10 minutes
  - Individual products: 15 minutes
- **Cache Invalidation**: Automatic on CREATE, UPDATE, DELETE operations

### Rate Limiting

- **Login Endpoint**: 5 attempts per 15 minutes per user/IP
- **User Registration**: 10 registrations per hour per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Cache Testing

```bash
# Test Redis connection
docker exec crud-redis redis-cli -a redispassword ping

# View cached keys
docker exec crud-redis redis-cli -a redispassword keys "crud-app:*"

# Monitor Redis operations
docker exec crud-redis redis-cli -a redispassword monitor
```

## 🎯 Role-Based Access Control (RBAC)

### Permission Matrix

| Endpoint               | USER | MODERATOR | ADMIN | Cache  | Rate Limit |
| ---------------------- | ---- | --------- | ----- | ------ | ---------- |
| `POST /users`          | ✅   | ✅        | ✅    | ❌     | 10/hour    |
| `GET /users`           | ❌   | ❌        | ✅    | 5 min  | ❌         |
| `GET /users/:id`       | ❌   | ❌        | ✅    | 10 min | ❌         |
| `PATCH /users/:id`     | ❌   | ❌        | ✅    | ❌     | ❌         |
| `DELETE /users/:id`    | ❌   | ❌        | ✅    | ❌     | ❌         |
| `POST /auth/login`     | ✅   | ✅        | ✅    | ❌     | 5/15min    |
| `GET /products`        | ✅   | ✅        | ✅    | 10 min | ❌         |
| `GET /products/:id`    | ✅   | ✅        | ✅    | 15 min | ❌         |
| `POST /products`       | ❌   | ✅        | ✅    | ❌     | ❌         |
| `PATCH /products/:id`  | ❌   | ✅        | ✅    | ❌     | ❌         |
| `DELETE /products/:id` | ❌   | ❌        | ✅    | ❌     | ❌         |

## 🐳 Docker Configuration

### Services

- **MySQL** (port 3306): User data storage
- **MongoDB** (port 27017): Product data storage
- **Redis** (port 6379): Caching and rate limiting
- **Application** (port 3000): NestJS API server

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d mysql mongodb redis

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f app
docker-compose logs -f redis

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Clean restart (remove volumes)
docker-compose down -v && docker-compose up -d
```

### Database Commands

```bash
# Access MySQL
docker exec -it crud-mysql mysql -u crud_user -p

# Access MongoDB
docker exec -it crud-mongodb mongosh --username root --password rootpassword --authenticationDatabase admin product_db

# Access Redis
docker exec -it crud-redis redis-cli -a redispassword
```

## 🧪 Testing

### Setup Test Data

```bash
# Add sample products to MongoDB
docker exec crud-mongodb mongosh --username root --password rootpassword --authenticationDatabase admin product_db --eval "
db.products.insertMany([
  {name: 'MacBook Pro', description: 'High-performance laptop', price: 2499.99, category: 'Electronics'},
  {name: 'iPhone 15', description: 'Latest smartphone', price: 999.99, category: 'Electronics'},
  {name: 'Wireless Headphones', description: 'Premium headphones', price: 299.99, category: 'Audio'}
])
"
```

### Manual Testing with Swagger

1. Go to http://localhost:3000/api/docs
2. Create a user with `POST /users` (copy the `access_token`)
3. Click **🔒 Authorize** → Enter: `Bearer your_access_token`
4. Test endpoints and watch console logs for caching behavior

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e -- test/users.e2e-spec.ts
npm run test:e2e -- test/products.e2e-spec.ts
npm run test:e2e -- test/auth.e2e-spec.ts
npm run test:e2e -- test/roles.e2e-spec.ts
```

### Test Coverage

- ✅ User CRUD operations with JWT tokens
- ✅ Product CRUD operations with caching
- ✅ Authentication flow with rate limiting
- ✅ Role-based access control
- ✅ Error handling scenarios
- ✅ Cache invalidation testing

## 🔨 Development

### Available Scripts

```bash
npm run build          # Build the application
npm run start          # Start production server
npm run start:dev      # Start development server (with hot reload)
npm run start:debug    # Start with debugging
npm run lint           # Run ESLint
npm run format         # Run Prettier
npm run test           # Run unit tests
npm run test:e2e       # Run E2E tests
```

### Development Workflow

1. Start services: `docker-compose up -d mysql mongodb redis`
2. Start app: `npm run start:dev`
3. View logs in terminal for Redis operations
4. Test with Swagger UI: http://localhost:3000/api/docs

### Code Quality Tools

- **ESLint**: TypeScript linting with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit validation
- **lint-staged**: Run linters only on staged files

## 📊 Database Schemas

### User Entity (MySQL/TypeORM)

```typescript
interface User {
  id: number; // Primary key
  name: string; // User's full name
  email: string; // Unique email address
  password: string; // Bcrypt hashed password
  role: Role; // USER | ADMIN | MODERATOR
}
```

### Product Schema (MongoDB/Mongoose)

```typescript
interface Product {
  _id: ObjectId; // MongoDB document ID
  name: string; // Product name
  description: string; // Product description
  price: number; // Product price
  category?: string; // Optional category
  createdAt: Date; // Auto-generated
  updatedAt: Date; // Auto-updated
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptom**: Application crashes on startup

```bash
# Check if ports are available
netstat -an | grep :3000
netstat -an | grep :6379

# Check Docker services
docker-compose ps
```

#### 2. Database Connection Issues

**MySQL Access Denied**:

```bash
# Check MySQL container
docker-compose logs mysql

# Fix: Restart MySQL service
docker-compose restart mysql
```

**MongoDB Connection Failed**:

```bash
# Check MongoDB container
docker-compose logs mongodb

# Test connection
docker exec crud-mongodb mongosh --username root --password rootpassword --eval "db.runCommand('ping')"
```

#### 3. Redis Connection Issues

**Redis Not Responding**:

```bash
# Check Redis container
docker-compose logs redis

# Test Redis connection
docker exec crud-redis redis-cli -a redispassword ping
```

#### 4. Caching Not Working

**No Keys in Redis**:

- Ensure you're authenticated in Swagger (JWT token)
- Check console logs for Redis operations
- Verify endpoints are being called correctly

**Cache Not Invalidating**:

- Check CREATE/UPDATE/DELETE operations
- Look for cache invalidation logs in console

#### 5. Rate Limiting Issues

**Getting 429 Too Many Requests**:

- Wait for the time window to reset
- Check `X-RateLimit-Reset` header
- Clear rate limit keys: `docker exec crud-redis redis-cli -a redispassword flushdb`

### Debug Commands

```bash
# View all Redis keys
docker exec crud-redis redis-cli -a redispassword keys "*"

# Monitor Redis operations in real-time
docker exec crud-redis redis-cli -a redispassword monitor

# Check Redis memory usage
docker exec crud-redis redis-cli -a redispassword info memory

# View application logs
docker-compose logs -f app

# Check database contents
docker exec crud-mongodb mongosh --username root --password rootpassword --authenticationDatabase admin product_db --eval "db.products.find().pretty()"
```

### Performance Optimization

- Monitor Redis hit/miss ratios
- Adjust TTL values based on usage patterns
- Use Redis clustering for high availability
- Implement Redis persistence for production

## 🔄 API Response Format

All API responses follow a consistent, type-safe format:

### Success Response

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  timestamp: string;
  data: T;
}
```

### Error Response

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

### Examples

```json
// User creation with JWT token
{
  "success": true,
  "timestamp": "2023-12-07T10:30:00.000Z",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Rate limit exceeded
{
  "success": false,
  "timestamp": "2023-12-07T10:30:00.000Z",
  "statusCode": 429,
  "message": "Too many login attempts. Please try again later.",
  "error": "Rate Limit Exceeded",
  "retryAfter": 300
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Change JWT_SECRET to a secure random string
- [ ] Update database passwords
- [ ] Configure Redis password
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=your-very-secure-secret-key-with-at-least-32-chars
REDIS_PASSWORD=your-secure-redis-password
MYSQL_PASS=your-secure-mysql-password
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Run tests: `npm run test:e2e`
6. Run linting: `npm run lint`
7. Commit changes: `git commit -m 'Add amazing feature'`
8. Push to branch: `git push origin feature/amazing-feature`
9. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all checks pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Redis](https://redis.io/) - In-memory data structure store
- [TypeORM](https://typeorm.io/) - ORM for TypeScript and JavaScript
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling
- [Passport](http://www.passportjs.org/) - Authentication middleware
- [Swagger](https://swagger.io/) - API documentation tools

## 📞 Support

For questions and support:

- 📧 Create an issue in this repository
- 📚 Check the [Swagger documentation](http://localhost:3000/api/docs)
- 🐛 Report bugs with detailed reproduction steps
- 💡 Suggest features via GitHub issues

---

**Happy Coding!** 🚀 Built with ❤️ using NestJS, Redis, and TypeScript.
