import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RedisService } from '../../../tools-library/src/redis/redis.service';
import { Blackjack } from '../../../../apps/pogos-games/src/blackjack/entities/blackjack.entity';
import { Poker } from '../../../../apps/pogos-games/src/poker/entities/poker.entity';
import { Uno } from '../../../../apps/pogos-games/src/new uno/entities/uno.entity';

@Controller('game')
export class GameController {
  private readonly gameMap: Record<string, any> = {
    blackjack: Blackjack,
    poker: Poker,
    uno: Uno
  };
  constructor(protected readonly redisService: RedisService) {
  }
  @Post('private-mode')
  async setPrivateMode(@Body() body: {gameId: string, clientId: string}): Promise<boolean> {
    let cursor = 0;

    do {
      const [nextCursor, keys] = await this.redisService.scan(
        cursor,
        `*:leaderId:${body.clientId}`
      );
      cursor = nextCursor;
      for (const key of keys) {
        const [gamePrefix] = key.split(":")
        if (!(gamePrefix in this.gameMap)) continue;

        const GameClass = this.gameMap[gamePrefix];
        const gameInstance = await this.redisService.get<typeof GameClass>(
          `${gamePrefix}:${body.gameId}`,
          GameClass
        );
        if (gameInstance?.changePrivacy) {
          gameInstance.changePrivacy();
          await this.redisService.set(key, gameInstance);
        }
        break
      }
    } while (cursor !== 0);
    return true;
  }
  @Get('join-random')
  async joinRandomGame(
    @Query('gamePrefix') gamePrefix: string,
    @Query('clientId') clientId: string
  ): Promise<{ success: boolean, gameId: string }> {
    let cursor = 0;
    let gameId: string = ''

    do {
      const [nextCursor, keys] = await this.redisService.scan(
        cursor,
        `${gamePrefix}:*`
      );
      cursor = nextCursor;
      for (const key of keys) {
        const GameClass = this.gameMap[gamePrefix];
        if (key.includes("leaderId")) continue;
        const gameInstance = await this.redisService.get<typeof GameClass>(key, GameClass);
        if (gameInstance?.private) continue
        if (gameInstance?._players.length == 4) continue
        gameId = gameInstance.id
        break
      }
    } while (cursor !== 0);
    return { success: gameId != "", gameId: gameId };
  }

  @Get('find')
  async findGame(
    @Query('gameId') gameId: string,
    @Query('clientId') clientId: string
  ): Promise<{ success: boolean; gameName: string }> {
    let cursor = 0;

    do {
      const [nextCursor, keys] = await this.redisService.scan(cursor, `*:#${gameId}`);
      cursor = nextCursor;

      for (const key of keys) {
        if (key.includes('leaderId')) continue;

        const [gamePrefix] = key.split(':');
        const GameClass = this.gameMap[gamePrefix];

        if (!GameClass) continue;

        const gameInstance = await this.redisService.get<typeof GameClass>(key, GameClass);

        if (!gameInstance || gameInstance.private || gameInstance._players.length === 4) continue;

        return { success: true, gameName: gamePrefix };
      }
    } while (cursor !== 0);

    return { success: false, gameName: '' };
  }

}
