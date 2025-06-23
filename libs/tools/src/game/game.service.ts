import { RedisService } from '../../../tools-library/src/redis/redis.service';
import { IdGeneratorService } from '../../../tools-library/src/id-generator.service';
import { Game, Player } from './entities/game.entity';
import { GameActionRequest } from './dto/request/game-action-request.interface';
import { GameResponse } from './dto/response/game-response.interface';
import { GamePlayerResponse } from './dto/response/game-player-response.interface';
import { Socket } from 'socket.io';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GameStatus } from './enum/game-status.enum';
import { BaseCard } from '../../../../apps/pogos-games/src/cards/model/card.interface';
import { GameStartRequest } from './dto/request/game-start-request.class';
import { GamePlayResponse } from './dto/response/game-play-response.interface';
import { BaseCardsService } from '../../../../apps/pogos-games/src/cards/base-cards.service';
import { GameCreationRequest } from './dto/request/game-creation-request.class';
import { GameJoinRequest } from './dto/request/game-join-request.class';
import { RedisChannel } from '../../../tools-library/src/redis/redis-channels.enum';
import {
  GameHistoryDto,
} from '../../../../apps/pogos-core/src/history/model/dto/response/game-history-response.interface';
import { GameType } from './enum/game-type.enum';
import { plainToInstance } from 'class-transformer';

export abstract class GameService<
  TGame extends Game<TResponse, TStartRequest, TPlayer, TPlayerResponse, TCard>,
  TStartRequest extends GameStartRequest,
  TResponse extends GameResponse,
  TPlayerResponse extends GamePlayerResponse,
  TPlayer extends Player,
  TPlayResponse extends GamePlayResponse,
  TCard extends BaseCard
> {
  constructor(
    protected readonly redisService: RedisService,
    protected readonly cardsService: BaseCardsService<TCard>,
    protected readonly idGeneratorService: IdGeneratorService
  ) {}

  protected GAME_KEY_PREFIX: string;
  protected readonly LEADER_KEY_PREFIX = 'leaderId';

  async disconnectClient(clientId: string,
                         GameClass: new (
                           id?: string,
                           deck?: TCard[],
                           leaderId?: string,
                           type?: string
                         ) => TGame): Promise<TGame[]> {
    let cursor = 0;
    let games: TGame[] = [];

    do {
      const [nextCursor, keys] = await this.redisService.scan(
        cursor,
        `${this.GAME_KEY_PREFIX}:*`,
      );
      cursor = nextCursor;

      for (const key of keys) {
        if (key.includes(this.LEADER_KEY_PREFIX)) continue;

        let game = await this.redisService.get<TGame>(key, GameClass);
        if (game?._players?.some((p) => p.id === clientId)) {
          game = await this.quitGame(game.id, clientId, GameClass);
          games.push(game);
        }
      }
    } while (cursor !== 0);
    return games
  }

  async deleteGame(game: TGame) {
    await this.redisService.delete(`${this.GAME_KEY_PREFIX}:${game.id}`);
    await this.redisService.delete(
      `${this.GAME_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${game.leaderId}`,
    );
  }

  async joinGame(joinRequest: GameJoinRequest, playerId: string,
                 GameClass: new(id?: string,
                                deck?: TCard[],
                                leaderId?: string,
                                type?: string) =>  TGame){
    const key = `${this.GAME_KEY_PREFIX}:${joinRequest.gameId}`;
    const game = await this.redisService.get<TGame>(key,GameClass)
      .then((game) => {
        if (!game) {
          throw new NotFoundException(`Game id ${joinRequest.gameId} not found`);
        }
        game.addUser(playerId, joinRequest.avatar, joinRequest.playerName);
        return game;
      });
    await this.saveGame(game);
    console.log("New player joined: ", playerId);
    return game.toResponse()
  }

  async quitGame(gameId: string, playerId: string,
                 GameClass: new(id?: string,
                                deck?: TCard[],
                                leaderId?: string,
                                type?: string) =>  TGame){
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    return this.redisService.get<TGame>(key,GameClass)
      .then(async (game) => {
        if (!game) {
          throw new NotFoundException(`Game id ${gameId} not found`);
        }
        game.removeUser(playerId);
        console.log("Player : " + playerId + " left");
        return await this.saveGame(game).then(async () => {
          if (game.checkNoPlayerLeft()) {
            await this.deleteGame(game);
          }
          return game
        })
      });
  }

  /**
   * End the game
   * @param client the client that is ending the game
   * @param gameId id of the game to end
   * @param GameClass
   * @returns list of player ids
   */
  async endGame(client: Socket, gameId: string,
                GameClass: new(id?: string,
                               deck?: TCard[],
                               leaderId?: string,
                               type?: string) => TGame ): Promise<TGame> {
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game = await this.redisService.get<TGame>(key, GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    if (game.leaderId !== client.id) {
      throw new UnauthorizedException(`Only the leader can end the game`);
    }
    game.status = GameStatus.ENDED;
    return game;
  }

  async persistGameHistory(gameId: string,
                           GameClass: new(id?: string,
                                          deck?: TCard[],
                                          leaderId?: string,
                                          type?: string) => TGame ) {
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game = plainToInstance(GameClass, (await this.redisService.get<TGame>(key, GameClass)));
    if (!game) {
      console.error(`Game with ID ${gameId} not found.`);
      return;
    }
    // Order players by the number of cards in their hand
    const sortedPlayers = game._players.sort((a, b) => a.hand.length - b.hand.length);

    // assign player names and avatars
    const gameHistoryDto: GameHistoryDto = {
      id: game.id,
      mode: game.mode,
      type: this.GAME_KEY_PREFIX.toUpperCase() as GameType,
      date: new Date(),
      player1: sortedPlayers[0]
        ? {
          id: sortedPlayers[0].id,
          username: sortedPlayers[0].username,
          avatar: sortedPlayers[0].avatar,
        }
        : null,
      player2: sortedPlayers[1]
        ? {
          id: sortedPlayers[1].id,
          username: sortedPlayers[1].username,
          avatar: sortedPlayers[1].avatar,
        }
        : null,
      player3: sortedPlayers[2]
        ? {
          id: sortedPlayers[2].id,
          username: sortedPlayers[2].username,
          avatar: sortedPlayers[2].avatar,
        }
        : null,
      player4: sortedPlayers[3]
        ? {
          id: sortedPlayers[3].id,
          username: sortedPlayers[3].username,
          avatar: sortedPlayers[3].avatar,
        }
        : null,
    } as GameHistoryDto;

    await this.redisService.publishToChannel<GameHistoryDto>(
      RedisChannel.HISTORY,
      gameHistoryDto,
    );
  }

  protected async saveGame(game: TGame): Promise<void> {
    const key = `${this.GAME_KEY_PREFIX}:${game.id}`;
    await this.redisService.set<TGame>(key, game);
    await this.persistGameToHistory(game.id)
  }

  protected async create(
    leaderId: string,
    creationRequest: GameCreationRequest,
    GameClass: new(id?: string,
                     deck?: TCard[],
                     leaderId?: string,
                     type?: string) => TGame
  ) {
    const leaderGames = await this.findByLeaderId(leaderId, GameClass);
    if(leaderGames.length > 0) {
      throw new UnauthorizedException(`Leader ${leaderId} already has an active game`);
    }
    const deck = this.cardsService.createDeck();
    const gameId =  await this.idGeneratorService.generateUniqueId('#', this.GAME_KEY_PREFIX);
    const game = new GameClass(gameId,deck,leaderId,creationRequest.type);
    game.addUser(leaderId,creationRequest.avatar, creationRequest.playerName)
    await this.saveGame(game);
    await this.redisService.sAdd(
      `${this.GAME_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`,
      [gameId],
    );
    return game;
  }

  protected async findByLeaderId(leaderId: string,
                                 GameClass: new(id?: string,
                                                  deck?: TCard[],
                                                  leaderId?: string,
                                                  type?: string) => TGame ): Promise<Awaited<TGame>[]>{
    const leaderKey = `${this.GAME_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`;
    const gameIds = await this.redisService.getSet(leaderKey);

    return await Promise.all(
      gameIds.map((gameId) =>
        this.redisService.get(`${this.GAME_KEY_PREFIX}:${gameId}`, GameClass),
      ),
    );
  }

  protected async playAction<TPlayResponse>(
    client: Socket,
    gameAction: GameActionRequest,
    GameClass: new (
      id?: string,
      deck?: TCard[],
      leaderId?: string,
      type?: string,
    ) => TGame,
    mapResponse: (
      player: TPlayer,
      players: string[],
    ) => { players: string[]; response: TPlayerResponse },
  ): Promise<TPlayResponse> {
    return this.redisService
      .get<TGame>(`${this.GAME_KEY_PREFIX}:${gameAction.gameId}`, GameClass)
      .then((game) => {
        if (!game) {
          throw new NotFoundException(`Game id ${gameAction.gameId} not found`);
        }
        const player = game._players.find((player) => player.id === client.id);
        if (!player) {
          throw new NotFoundException(`Player id ${client.id} not found`);
        }
        if (game.status != GameStatus.IN_PROGRESS) {
          throw new NotFoundException(`Game hasn't started`);
        }
        let end = game.play(player, gameAction);
        this.saveGame(game);
        if (end) {
          end = this.checkEnd(game);
        }
        const players = game._players.map((player) => player.id);

        const response = mapResponse(player, players)
        return { players:response.players, end:end, response: response.response , game: game, currentPlayerId: client.id} as TPlayResponse;
      })
  }

  protected checkEnd(game: TGame): boolean {
    return true;
  }

  protected async start(clientId: string, gameId:string,
                                      GameClass: new(id?: string,
                                                       deck?: TCard[],
                                                       leaderId?: string,
                                                       type?: string) => TGame,
                                      startRequest: TStartRequest ) {
    const game = await this.findGame(gameId, GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    if (game.leaderId !== clientId) {
      throw new UnauthorizedException(`Only the leader can start the game`);
    }

    try {
      game.startGame(startRequest);
    } catch (e){
      await this.deleteGame(game)
      throw e
    }
    await this.saveGame(game);

    return game.toResponse();
  }


  protected async restart(clientId: string, gameId:string,
                        GameClass: new(id?: string,
                                       deck?: TCard[],
                                       leaderId?: string,
                                       type?: string) => TGame,
                          startRequest: TStartRequest ) {
    const game = await this.findGame(gameId, GameClass);
    if (game.leaderId !== clientId) {
      throw new UnauthorizedException(`Only the leader can restart the game`);
    }

    game.restartGame(startRequest);
    await this.saveGame(game);

    return game.toResponse();
  }

  protected async findGame(gameId:string,
                           GameClass: new(id?: string,
                                          deck?: TCard[],
                                          leaderId?: string,
                                          type?: string) => TGame) {
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game: TGame = await this.redisService.get<TGame>(key, GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    return game;
  }

  abstract getGame(gameId: string): Promise<TGame>;
  abstract createGame(leaderId: string, creationRequest: GameCreationRequest): Promise<TResponse>;
  abstract persistGameToHistory(gameId: string): Promise<void>;
  abstract startGame(clientId: string, request: GameStartRequest): Promise<TResponse>;
  abstract restartGame(clientId: string, request: GameStartRequest): Promise<TResponse>;
  abstract join(joinRequest: GameJoinRequest, playerId: string): Promise<TResponse>;
  abstract quit(gameId: string, playerId: string): Promise<TGame>;
  abstract play(
    client: Socket,
    gameAction: GameActionRequest,
  ): Promise<TPlayResponse>;
  abstract mapResponse(
    player: TPlayer,
    players: string[],
  ): { players: string[]; response: TPlayerResponse };
}