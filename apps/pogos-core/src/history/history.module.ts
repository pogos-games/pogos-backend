import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './model/entity/game-history.entity';
import { GameHistoryProfile } from './gamehistory.profile';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory])],
  controllers: [HistoryController],
  providers: [HistoryService, GameHistoryProfile],
})
export class HistoryModule {}
