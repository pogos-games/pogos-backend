import { Module } from '@nestjs/common';
import { BlackjackService } from './blackjack.service';
import { BlackjackGateway } from './blackjack.gateway';
import { CardsModule } from '../cards/cards.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [CardsModule, RedisModule],
  providers: [BlackjackService, BlackjackGateway],
  controllers: [],
})
export class BlackjackModule {}