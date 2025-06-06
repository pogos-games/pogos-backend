import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from './model/entity/game-history.entity';
import { Repository } from 'typeorm';
import { PageOptions } from '../../../../libs/commons-core-library/src/dto/response/page/page-options.interface';
import { Mapper } from '@automapper/core';
import { GameHistoryResponse } from './model/dto/response/game-history-response.interface';
import { PageMeta } from '../../../../libs/commons-core-library/src/dto/response/page/page-meta.interface';
import { Page } from '../../../../libs/commons-core-library/src/dto/response/page/page.interface';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    private readonly mapper: Mapper,
  ) {}

  async findHistoryByUserId(
    userId: string,
    pageOptions: PageOptions,
    gameType?: string,
  ) {
    const queryBuilder = this.gameHistoryRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player1', 'player1')
      .leftJoinAndSelect('game.player2', 'player2')
      .leftJoinAndSelect('game.player3', 'player3')
      .leftJoinAndSelect('game.player4', 'player4');

    queryBuilder.where(
      '(player1.id = :userId OR player2.id = :userId OR player3.id = :userId OR player4.id = :userId)',
      { userId },
    );

    if (gameType) {
      queryBuilder.andWhere('game.gameType = :gameType', { gameType });
    }

    queryBuilder
      .skip(pageOptions.skip)
      .take(pageOptions.take)
      .orderBy('game.date', pageOptions.order);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const mappedEntities: GameHistoryResponse[] = this.mapper.mapArray(
      entities,
      GameHistory,
      GameHistoryResponse,
    );

    const pageMeta = new PageMeta({ itemCount, pageOptions });
    return new Page(mappedEntities, pageMeta);
  }
}