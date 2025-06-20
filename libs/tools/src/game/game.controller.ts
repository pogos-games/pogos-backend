import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RedisService } from '../../../tools-library/src/redis/redis.service';
import { Blackjack } from '../../../../apps/pogos-games/src/blackjack/entities/blackjack.entity';
import { Poker } from '../../../../apps/pogos-games/src/poker/entities/poker.entity';
import { UnoGame } from '../../../../apps/pogos-games/src/uno/model/uno-game.class';

@Controller('game/')
export class GameController {
  private readonly gameMap: Record<string, any> = {
    blackjack: Blackjack,
    poker: Poker,
    uno: UnoGame
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
        if (gameInstance?.players.length == 4) continue
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
  ): Promise<{ success: boolean, gameName: string }> {
    let cursor = 0
    let gamePrefix = ""
    let success = false
    do {
      const [nextCursor, keys] = await this.redisService.scan(
        cursor,
        `*:#${gameId}`
      );
      cursor = nextCursor;
      for (const key of keys) {
        if (key.includes("leaderId")) continue;
        [gamePrefix] = key.split(":")
        if (this.gameMap[gamePrefix]) {
          const GameClass = this.gameMap[gamePrefix];
          const gameInstance = await this.redisService.get<typeof GameClass>(key, GameClass);
          if (gameInstance?.private) continue
          if (gameInstance?.players.length == 4) continue
          success = true
          break
        }
      }
    } while (cursor !== 0);
    return { success: success, gameName: gamePrefix };
  }
}
