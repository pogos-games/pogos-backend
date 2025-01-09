import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class IdGeneratorService {
  constructor(private readonly redisService: RedisService) {}

  async generateUniqueId(prefix: string, keyPrefix: string): Promise<string> {
    let uniqueId: string;
    let exists: boolean;

    do {
      uniqueId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
      exists = await this.redisService.exists(`${keyPrefix}:${uniqueId}`);
    } while (exists);

    return uniqueId;
  }
}