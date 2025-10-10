import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Product Inventory Management System API')
  .setDescription(
    'API documentation for the Product Inventory Management System using MySQL and MongoDB',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .build();
