import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RedisService } from '../../../tools-library/src/redis/redis.service';
import { Blackjack } from '../../../../apps/pogos-games/src/blackjack/entities/blackjack.entity';
import { Poker } from '../../../../apps/pogos-games/src/poker/entities/poker.entity';
import { GameMode } from './enum/game-mode.enum';
import { GameStatus } from './enum/game-status.enum';
import { Uno } from '../../../../apps/pogos-games/src/uno/entities/uno.entity';

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
    @Query('gameName') gameAskedName: string,
    @Query('clientId') clientId: string
  ): Promise<{ success: boolean, gameId: string, gameName: string, gameMode: GameMode }> {
    let cursor = 0;
    let gameId: string = ''
    let gameName: string = ''
    let gameMode: GameMode = GameMode.MULTIPLAYER

    do {
      const [nextCursor, keys] = await this.redisService.scan(
        cursor,
        `${gameAskedName}:*`
      );
      cursor = nextCursor;
      for (const key of keys) {
        if (key.includes("leaderId")) continue;
        const gamePrefix = key.split(":")[0]
        const gameFoundId = key.split(":")[1]
        console.log(`gameFound: ${gamePrefix}, id: ${gameFoundId}`);
        const GameClass = this.gameMap[gamePrefix];
        const gameInstance = await this.redisService.get<typeof GameClass>(key, GameClass);
        if (gameFoundId != gameInstance.id || gameInstance?.private ||
          gameInstance?._mode == GameMode.SOLO || gameInstance?._players.length == 4 ||
         gameInstance.status != GameStatus.WAITING) continue
        gameId = gameInstance.id
        gameName = gameInstance._type.toLowerCase()
        gameMode = gameInstance._mode
        break
      }
    } while (cursor !== 0);
    console.log(`connecting to ${gameName}, id: ${gameId}, mode: ${gameMode}`);
    return { success: gameId != "", gameId: gameId, gameName: gameName, gameMode: gameMode };
  }

  @Get('find')
  async findGame(
    @Query('gameId') gameId: string,
    @Query('clientId') clientId: string
  ): Promise<{ success: boolean; gameName: string, gameMode: GameMode }> {
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

        return { success: true, gameName: gamePrefix, gameMode: gameInstance.gameMode };
      }
    } while (cursor !== 0);

    return { success: false, gameName: '', gameMode: GameMode.MULTIPLAYER };
  }

}
