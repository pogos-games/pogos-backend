import { Module } from '@nestjs/common';
import { GameSubscriberService } from './game-subscriber.service';
import { ToolsModule } from '../../../../libs/tools-library/src';

@Module({
  providers: [GameSubscriberService],
  imports: [ToolsModule],
})
export class GameModule {}
