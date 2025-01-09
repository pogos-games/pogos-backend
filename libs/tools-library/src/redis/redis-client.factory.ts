import { FactoryProvider } from '@nestjs/common';
import { createClient } from 'redis';
import { REDIS_CLIENT, RedisClient } from './redis-client.type';
import { ConfigService } from '@nestjs/config';

export const redisClientFactory: FactoryProvider<Promise<RedisClient>> = {
  provide: REDIS_CLIENT,
  useFactory: async (configService: ConfigService) => {
    const client = createClient({
      url: configService.get<string>('REDIS_URL'),
    });
    await client.connect();
    return client;
  },
  inject: [ConfigService],
};