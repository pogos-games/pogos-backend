import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { PageOptions } from '../../../../libs/commons-core-library/src/dto/response/page/page-options.interface';
import { HistoryService } from './history.service';
import { GameType } from '../../../../libs/tools/src/game/enum/game-type.enum';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get(':userId')
  @ApiQuery({ name: 'gameType', enum: GameType, required: false })
  async findHistoryByUserId(
    @Param('userId') userId: string,
    @Query() pageOptions: PageOptions,
    @Query('gameType') gameType?: GameType,
  ) {
    return this.historyService.findHistoryByUserId(
      userId,
      pageOptions,
      gameType,
    );
  }

  @Get()
  @ApiQuery({ name: 'gameType', enum: GameType, required: false })
  async findHistory(
    @Query() pageOptions: PageOptions,
    @Query('gameType') gameType?: GameType,
  ) {
    return this.historyService.findHistory(pageOptions, gameType);
  }
}
