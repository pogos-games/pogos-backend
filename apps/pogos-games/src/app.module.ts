import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { BlackjackModule } from './blackjack/blackjack.module';
import { CardsModule } from './cards/cards.module';
import { RedisModule } from './redis/redis.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
      ChatModule,
      BlackjackModule,
      CardsModule,
      RedisModule
    ],
  exports: [],
})
export class AppModule {}
