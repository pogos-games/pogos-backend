import { Module } from '@nestjs/common';
import { BlackjackModule } from './blackjack/blackjack.module';
import { CardsModule } from './cards/cards.module';
import { ConfigModule } from '@nestjs/config';
import { ToolsModule } from '../../../libs/tools-library/src';
import { ChatModule } from '../../../libs/tools/src/chat/chat.module';
import { PokerModule } from './poker/poker.module';
import { NewUnoModule } from './new uno/new-uno.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ChatModule,
    BlackjackModule,
    PokerModule,
    CardsModule,
    ToolsModule,
    NewUnoModule
  ],
  exports: [],
})
export class AppModule {}
