import { Module } from '@nestjs/common';
import { BlackjackModule } from './blackjack/blackjack.module';
import { CardsModule } from './cards/cards.module';
import { ConfigModule } from '@nestjs/config';
import { ToolsModule } from '../../../libs/tools-library/src';
import { PokerModule } from './poker/poker.module';
import { UnoModule } from './uno/uno.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BlackjackModule,
    PokerModule,
    CardsModule,
    ToolsModule,
    UnoModule
  ],
  exports: [],
})
export class AppModule {}
