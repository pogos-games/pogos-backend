import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { randomInt } from 'crypto';

@Injectable()
export class IdGeneratorService {
  constructor(private readonly redisService: RedisService) {}

  async generateUniqueId(prefix: string, keyPrefix: string): Promise<string> {
    let uniqueId: string;
    let exists: boolean;

    do {
      uniqueId = `${prefix}${randomInt(1000, 10000)}`;
      exists = await this.redisService.exists(`${keyPrefix}:${uniqueId}`);
    } while (exists);

    return uniqueId;
  }
}