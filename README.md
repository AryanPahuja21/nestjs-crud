# 🚀 NestJS CRUD Application

A modern, full-featured CRUD application built with NestJS, featuring dual-database architecture, JWT authentication, and role-based access control.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Authentication & Authorization](#-authentication--authorization)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Contributing](#-contributing)

## ✨ Features

### Core Features

- **User Management** - Complete CRUD operations for users
- **Product Management** - Full product lifecycle management
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Three-tier role system (User, Moderator, Admin)
- **Dual Database Architecture** - MySQL for users, MongoDB for products
- **Input Validation** - Comprehensive data validation with class-validator
- **Error Handling** - Centralized exception handling with custom exceptions
- **API Documentation** - Interactive Swagger/OpenAPI documentation
- **Response Standardization** - Consistent API response format

### Development Features

- **Docker Support** - Full containerization with Docker Compose
- **Code Quality** - ESLint, Prettier, and Husky pre-commit hooks
- **Testing** - Unit and E2E tests with Jest
- **Type Safety** - Full TypeScript implementation
- **Hot Reload** - Development server with auto-reload

## 🛠 Tech Stack

### Backend Framework

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Node.js** - Runtime environment

### Databases

- **MySQL** (TypeORM) - User data and authentication
- **MongoDB** (Mongoose) - Product catalog and management

### Authentication & Security

- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Passport** - Authentication middleware
- **Class Validator** - Input validation

### Documentation & Testing

- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework
- **Supertest** - HTTP testing

### Development Tools

- **Docker & Docker Compose** - Containerization
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Staged file linting

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Docker & Docker Compose** (for containerized setup)
- **Git**

### Installation Options

#### Option 1: Docker Setup (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/AryanPahuja21/nestjs-crud.git
   cd nestjs-crud
   ```

2. **Configure environment**

   ```bash
   cp docker.env .env
   # Edit .env file with your preferred settings
   ```

3. **Start with Docker Compose**

   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api/docs

#### Option 2: Local Development Setup

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/AryanPahuja21/nestjs-crud.git
   cd nestjs-crud
   npm install
   ```

2. **Set up databases**
   - Install and start MySQL (port 3306)
   - Install and start MongoDB (port 27017)

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Configure your database connections in .env
   ```

4. **Run the application**

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## 🔧 Environment Variables

### Database Configuration

```env
# MySQL Configuration (Users)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=crud_user
MYSQL_PASS=crud_password
MYSQL_DB=user_db
MYSQL_ROOT_PASSWORD=rootpassword

# MongoDB Configuration (Products)
MONGO_URI=mongodb://localhost:27017/product_db

# Application
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRY=1h
```

## 📚 API Documentation

### Interactive Documentation

Access the full API documentation at: **http://localhost:3000/api/docs**

### Quick API Overview

#### Authentication Endpoints

```bash
POST /auth/login          # User login
```

#### User Management

```bash
POST   /users             # Create user (returns JWT)
GET    /users             # Get all users (Admin only)
GET    /users/:id         # Get user by ID (Admin only)
PATCH  /users/:id         # Update user (Admin only)
DELETE /users/:id         # Delete user (Admin only)
```

#### Product Management

```bash
POST   /products          # Create product (Admin/Moderator)
GET    /products          # Get all products (Authenticated users)
GET    /products/:id      # Get product by ID (Authenticated users)
PATCH  /products/:id      # Update product (Admin/Moderator)
DELETE /products/:id      # Delete product (Admin only)
```

### Sample API Calls

#### Register a New User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "role": "user"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

#### Create a Product (with JWT token)

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 1200,
    "category": "Electronics"
  }'
```

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

The application implements a three-tier role system:

#### 👤 **USER** (Default Role)

- View products
- Access own profile (when implemented)

#### 👮 **MODERATOR**

- All USER permissions
- Create and update products
- Moderate product content

#### 👑 **ADMIN**

- All MODERATOR permissions
- Full user management
- Delete products
- System administration

### JWT Token Structure

```json
{
  "username": "user@example.com",
  "sub": 123,
  "role": "admin",
  "iat": 1645123456,
  "exp": 1645127056
}
```

### Protected Routes

- All product routes require authentication
- User management routes require admin role
- Product creation/modification requires admin or moderator role
- Product deletion requires admin role

## 🗄️ Database Schema

### MySQL - User Management

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'moderator') DEFAULT 'user'
);
```

### MongoDB - Product Management

```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  price: Number (required),
  category: String,
  stockQuantity: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

## 📁 Project Structure

```
src/
├── app.module.ts              # Root application module
├── main.ts                    # Application entry point
├── common/                    # Shared components
│   ├── decorators/           # Custom decorators (@Roles)
│   ├── enums/               # Role enums
│   ├── exceptions/          # Custom exceptions
│   ├── filters/             # Exception filters
│   ├── guards/              # Authentication & authorization guards
│   └── interceptors/        # Response interceptors
├── config/                   # Configuration files
│   ├── app.config.ts        # Application configuration
│   ├── database.config.ts   # Database configuration
│   └── swagger.config.ts    # API documentation config
├── constants/               # Application constants
├── database/               # Database related files
│   ├── entities/           # TypeORM entities (Users)
│   └── schemas/            # Mongoose schemas (Products)
├── modules/               # Feature modules
│   ├── auth/             # Authentication module
│   ├── user/             # User management module
│   └── product/          # Product management module
├── types/                # TypeScript type definitions
└── utils/               # Utility functions
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Test Categories

- **Unit Tests** - Individual component testing
- **E2E Tests** - End-to-end API testing
- **Authentication Tests** - JWT and login flow testing
- **RBAC Tests** - Role-based access control verification

### Sample Test Execution

```bash
# Run specific E2E test
npm run test:e2e -- --testNamePattern="User Management"

# Run RBAC tests
npm run test:e2e -- test/roles.e2e-spec.ts
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm run test
   npm run test:e2e
   ```
5. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Create a Pull Request**

### Code Quality Standards

- **ESLint** - Code linting (runs on pre-commit)
- **Prettier** - Code formatting (runs on pre-commit)
- **TypeScript** - Type safety required
- **Jest** - Test coverage expected for new features
- **Conventional Commits** - Commit message format

### Pre-commit Hooks

The project uses Husky and lint-staged to ensure code quality:

- Automatic linting and formatting
- Test execution on staged files
- Commit message validation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS Team** - For the amazing framework
- **TypeORM & Mongoose** - For excellent ORM/ODM solutions
- **Contributors** - Thank you for your contributions!

---

**Built with ❤️ by [Aryan Pahuja](https://github.com/AryanPahuja21)**

For questions or support, please open an issue on GitHub.
