// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule,

    // MySQL (TypeORM)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mysql = config.get<{
          host: string;
          port: number;
          username: string;
          password: string;
          database: string;
        }>('database.mysql');
        return {
          type: 'mysql' as const,
          host: mysql?.host,
          port: mysql?.port,
          username: mysql?.username,
          password: mysql?.password,
          database: mysql?.database,
          entities: [User],
          synchronize: true,
        };
      },
    }),

    // MongoDB (Mongoose)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mongodb = config.get<{ uri: string }>('database.mongodb');
        return { uri: mongodb?.uri || '' };
      },
    }),
  ],
})
export class DatabaseModule {}
