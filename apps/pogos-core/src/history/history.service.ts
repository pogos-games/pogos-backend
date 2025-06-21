import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from './model/entity/game-history.entity';
import { Repository } from 'typeorm';
import { PageOptions } from '../../../../libs/commons-core-library/src/dto/response/page/page-options.interface';
import { Mapper } from '@automapper/core';
import { GameHistoryDto } from './model/dto/response/game-history-response.interface';
import { PageMeta } from '../../../../libs/commons-core-library/src/dto/response/page/page-meta.interface';
import { Page } from '../../../../libs/commons-core-library/src/dto/response/page/page.interface';
import { RedisService } from '../../../../libs/tools-library/src/redis/redis.service';
import { InjectMapper } from '@automapper/nestjs';
import { User } from '../user/model/entity/user.entity';
import { RedisChannel } from '../../../../libs/tools-library/src/redis/redis-channels.enum';
import { GameType } from '../../../../libs/tools/src/game/enum/game-type.enum';
import { GamePoints } from './model/enum/game-points.enum';

@Injectable()
export class HistoryService implements OnModuleInit {
  constructor(
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectMapper()
    private readonly mapper: Mapper,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.initRedisListener();
  }

  private initRedisListener() {
    this.redisService.subscribeToChannel<GameHistoryDto>(
      RedisChannel.HISTORY, (data) => this.saveHistory(data)
    ).then();
  }

  async saveHistory(gameHistoryDto: GameHistoryDto) {
    const entity = new GameHistory();
    entity.id = gameHistoryDto.id;
    entity.mode = gameHistoryDto.mode;
    entity.type = gameHistoryDto.type;
    entity.date = new Date(gameHistoryDto.date);

    const fetchUserAndName = async (userDto?: {
      id?: string;
      username?: string;
    }): Promise<{ user: User | null; name: string | null }> => {
      if (!userDto) return { user: null, name: null };
      const user = userDto.id
        ? await this.userRepository.findOneBy({
          username: userDto.username,
        })
        : null;
      const name = user?.username ?? userDto.username ?? null;
      return { user, name };
    };

    const p1 = await fetchUserAndName(gameHistoryDto.player1);
    const p2 = await fetchUserAndName(gameHistoryDto.player2);
    const p3 = await fetchUserAndName(gameHistoryDto.player3);
    const p4 = await fetchUserAndName(gameHistoryDto.player4);

    entity.player1 = p1.user;
    entity.player1Name = p1.name;

    entity.player2 = p2.user;
    entity.player2Name = p2.name;

    entity.player3 = p3.user;
    entity.player3Name = p3.name;

    entity.player4 = p4.user;
    entity.player4Name = p4.name;

    try {
      await this.gameHistoryRepository.save(entity);
      console.log(`GameHistory ${entity.id} persisted`);

      // Mise à jour des points (via méthode métier dans User)
      const playersWithPoints: { user: User | null; points: number }[] = [
        { user: p1.user, points: GamePoints.FIRST },
        { user: p2.user, points: GamePoints.SECOND },
        { user: p3.user, points: GamePoints.THIRD },
        { user: p4.user, points: GamePoints.FOURTH },
      ];

      for (const { user, points } of playersWithPoints) {
        if (user) {
          user.addPoints(points);
          await this.userRepository.save(user);
        }
      }
    } catch (error) {
      console.error(
        'Failed to persist GameHistory or update points:',
        error,
      );
    }
  }

  async findHistory(pageOptions?: PageOptions, gameType?: GameType) {
    const queryBuilder = this.gameHistoryRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player1', 'player1')
      .leftJoinAndSelect('game.player2', 'player2')
      .leftJoinAndSelect('game.player3', 'player3')
      .leftJoinAndSelect('game.player4', 'player4');

    if (gameType) {
      queryBuilder.andWhere('game.type = :gameType', { gameType });
    }

    queryBuilder
      .skip(pageOptions?.skip || 0)
      .take(pageOptions?.take || 10)
      .orderBy('game.date', pageOptions?.order || 'DESC');

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const mappedEntities: GameHistoryDto[] = this.mapper.mapArray(
      entities,
      GameHistory,
      GameHistoryDto,
    );

    const pageMeta = new PageMeta({ itemCount, pageOptions });
    return new Page(mappedEntities, pageMeta);
  }

  async findHistoryByUserId(
    userId: string,
    pageOptions: PageOptions,
    gameType?: GameType,
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
      queryBuilder.andWhere('game.type = :gameType', { gameType });
    }

    queryBuilder
      .skip(pageOptions.skip)
      .take(pageOptions.take)
      .orderBy('game.date', pageOptions.order);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const mappedEntities: GameHistoryDto[] = this.mapper.mapArray(
      entities,
      GameHistory,
      GameHistoryDto,
    );

    const pageMeta = new PageMeta({ itemCount, pageOptions });
    return new Page(mappedEntities, pageMeta);
  }
}
