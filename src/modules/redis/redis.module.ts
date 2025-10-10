import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';
import redisConfig from '../../config/redis.config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfiguration = configService.get('redis') as {
          host: string;
          port: number;
          password?: string;
          db: number;
          ttl: number;
          keyPrefix: string;
        };

        const keyv = new Keyv({
          store: new KeyvRedis(
            `redis://${redisConfiguration.password ? `:${redisConfiguration.password}@` : ''}${redisConfiguration.host}:${redisConfiguration.port}/${redisConfiguration.db}`,
          ),
          ttl: redisConfiguration.ttl * 1000, // Convert to milliseconds
          namespace: redisConfiguration.keyPrefix,
        });

        return {
          store: keyv,
          ttl: redisConfiguration.ttl * 1000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, CacheModule],
})
export class RedisModule {}
