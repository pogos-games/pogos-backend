import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { UnoService } from './uno.service';
import { GameController } from '../../../../libs/tools/src/game/game.controller';
import { UnoGateway } from './uno.gateway';
import { ToolsModule } from '../../../../libs/tools-library/src';
import { UnoCardsService } from './uno-cards.service';

@Module({
  imports: [CardsModule, ToolsModule ],
  providers: [UnoService, UnoGateway, UnoCardsService],
  controllers: [GameController],
})
export class UnoModule {}