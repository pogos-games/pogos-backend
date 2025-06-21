import { Module } from '@nestjs/common';
import { PokerService } from './poker.service';
import { PokerGateway } from './poker.gateway';
import { CardsModule } from '../cards/cards.module';
import { ToolsModule } from '../../../../libs/tools-library/src';
import { GameController } from '../../../../libs/tools/src/game/game.controller';

@Module({
  imports: [CardsModule, ToolsModule ],
  providers: [PokerService, PokerGateway],
  controllers: [GameController],
})
export class PokerModule {}