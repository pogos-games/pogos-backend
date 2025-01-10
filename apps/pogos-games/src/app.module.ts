import { Module } from '@nestjs/common';
import { BlackjackModule } from './blackjack/blackjack.module';
import { CardsModule } from './cards/cards.module';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from '../../../libs/tools/src/chat/chat.module';
import { ToolsModule } from '../../../libs/tools/src';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ChatModule,
    BlackjackModule,
    CardsModule,
    ToolsModule,
  ],
  exports: [],
})
export class AppModule {}
