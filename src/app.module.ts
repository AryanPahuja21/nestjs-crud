import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    // MySQL connection
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'test_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    // MongoDB connection
    MongooseModule.forRoot('mongodb://localhost:27017/test_mongo'),
    UserModule,
    ProductModule,
  ],
})
export class AppModule {}
