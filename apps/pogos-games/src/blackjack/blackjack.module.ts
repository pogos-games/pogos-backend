import { Module } from '@nestjs/common';
import { BlackjackService } from './blackjack.service';
import { BlackjackGateway } from './blackjack.gateway';
import { CardsModule } from '../cards/cards.module';
import { ToolsModule } from '../../../../libs/tools/src';

@Module({
  imports: [CardsModule, ToolsModule ],
  providers: [BlackjackService, BlackjackGateway],
  controllers: [],
})
export class BlackjackModule {}