import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../../../libs/tools-library/src/redis/redis.service';

@Injectable()
export class GameSubscriberService implements OnModuleInit {
  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    this.redisService.subscribe('games', (message) => {
      console.log('Received message from Redis:', message);
    });
  }
}