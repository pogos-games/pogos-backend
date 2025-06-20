import { Module } from '@nestjs/common';
import { BlackjackService } from './blackjack.service';
import { BlackjackGateway } from './blackjack.gateway';
import { CardsModule } from '../cards/cards.module';
import { ToolsModule } from '../../../../libs/tools-library/src';
import { GameController } from '../../../../libs/tools/src/game/game.controller';

@Module({
  imports: [CardsModule, ToolsModule ],
  providers: [BlackjackService, BlackjackGateway],
  controllers: [GameController],
})
export class BlackjackModule {}