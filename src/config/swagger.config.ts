import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Product Inventory Management System API')
  .setDescription(
    'API documentation for the Product Inventory Management System with Payment Integration using MySQL and MongoDB. Includes user management, product catalog, and Stripe payment processing.',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication endpoints')
  .addTag('users', 'User management endpoints')
  .addTag('products', 'Product management endpoints')
  .addTag('payments', 'Payment processing endpoints')
  .build();
