import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // TypeOrm & Mongoose modules will be added in DB section
  ],
})
export class AppModule {}
