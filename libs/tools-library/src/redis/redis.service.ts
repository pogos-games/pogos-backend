import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, RedisClient } from './redis-client.type';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  async get<TGame>(key: string, type: { new(...args: any[]): TGame }): Promise<TGame> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }
    const parsedValue = JSON.parse(value);
    return Object.assign(new type(), parsedValue);
  }

  async set<T>(key: string, value: T, expiration?: number) {
    const jsonValue = JSON.stringify(value);
    if (expiration) {
      await this.redis.set(key, jsonValue, { EX: expiration });
    } else {
      await this.redis.set(key, jsonValue);
    }
  }

  async getSet(key: string): Promise<string[]> {
    return this.redis.sMembers(key);
  }

  async sAdd(key: string, members: string[]): Promise<number> {
    return this.redis.sAdd(key, members);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result > 0;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

}
