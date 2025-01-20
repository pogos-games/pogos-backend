import { Module } from '@nestjs/common';
import { PokerService } from './poker.service';
import { PokerGateway } from './poker.gateway';
import { CardsModule } from '../cards/cards.module';
import { ToolsModule } from '../../../../libs/tools-library/src';

@Module({
  imports: [CardsModule, ToolsModule ],
  providers: [PokerService, PokerGateway],
  controllers: [],
})
export class PokerModule {}