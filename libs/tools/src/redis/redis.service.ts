import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, RedisClient } from './redis-client.type';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  async get<T>(key: string): Promise<T> {
    const value = await this.redis.get(key);
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T) {
    await this.redis.set(key, JSON.stringify(value));
  }

  async getSet(key: string): Promise<string[]> {
    return this.redis.sMembers(key);
  }

  async sadd(key: string, members: string[]): Promise<number> {
    return this.redis.sAdd(key, members);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result > 0;
  }

}
