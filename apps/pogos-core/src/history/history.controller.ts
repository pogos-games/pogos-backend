import { Controller, Get, Param, Query } from '@nestjs/common';
import { PageOptions } from '../../../../libs/commons-core-library/src/dto/response/page/page-options.interface';
import { GameType } from './model/enum/game-type.enum';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get(':userId')
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
}
