import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './model/entity/game-history.entity';
import { GameHistoryProfile } from './game-history.profile';
import { ToolsModule } from '../../../../libs/tools-library/src';
import { DatabaseModule } from '@app/database';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { User } from '../user/model/entity/user.entity';

@Module({
  imports: [
    DatabaseModule,
    ToolsModule,
    TypeOrmModule.forFeature([GameHistory, User]),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
  ],
  controllers: [HistoryController],
  providers: [HistoryService, GameHistoryProfile],
})
export class HistoryModule {}
