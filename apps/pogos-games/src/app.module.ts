import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { BlackjackModule } from './blackjack/blackjack.module';
import { CardsModule } from './cards/cards.module';
import { ConfigModule } from '@nestjs/config';
import { ToolsModule } from '../../../libs/tools-library/src';

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
