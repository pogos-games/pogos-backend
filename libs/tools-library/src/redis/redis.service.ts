import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, RedisClient } from './redis-client.type';
import { BaseCard } from '../../../../apps/pogos-games/src/cards/model/card.interface';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  async get<TGame>(key: string, type: new(id?: string,
                                            deck?: BaseCard[],
                                            leaderId?: string,
                                            type?: string) => TGame ): Promise<TGame> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }
    const parsedValue = JSON.parse(value);
    return Object.assign(new type(), parsedValue);
  }
  async scan(
    cursor = 0,
    pattern = '*',
    count = 10,
  ): Promise<[number, string[]]> {
    const result = await this.redis.scan(cursor, {
      MATCH: pattern,
      COUNT: count,
    });
    return [result.cursor, result.keys];
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

  async subscribeToChannel<T>(
    channel: string,
    callback: (message: T) => void,
  ): Promise<void> {
    await this.redis.subscribe(channel, (rawMessage: string) => {
      try {
        const parsedMessage: T = JSON.parse(rawMessage);
        callback(parsedMessage);
      } catch (error) {
        console.error(
          `Failed to parse message from channel "${channel}":`,
          error,
        );
      }
    });
  }

  async publishToChannel<T>(channel: string, message: T): Promise<void> {
    const jsonMessage = JSON.stringify(message);
    await this.redis.publish(channel, jsonMessage);
  }

}
