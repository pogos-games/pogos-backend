import { CardsService } from 'apps/pogos-games/src/cards/cards.service';
import { RedisService } from '../../../tools-library/src/redis/redis.service';
import { IdGeneratorService } from '../../../tools-library/src/id-generator.service';
import { Game, Player } from './entities/game.entity';
import { GameActionRequest } from './dto/request/game-action-request.interface';
import { GameResponse } from './dto/response/game-response.interface';
import { GamePlayerResponse } from './dto/response/game-player-response.interface';
import { Socket } from 'socket.io';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GameStatus } from './enum/game-status.enum';
import { Card } from '../../../../apps/pogos-games/src/cards/model/card.interface';
import { GameStartRequest } from './dto/request/game-start-request.class';
import { GamePlayResponse } from './dto/response/game-play-response.interface';

export abstract class GameService<
  TGame extends Game<TResponse, TStartRequest, TPlayer, TPlayerResponse>,
  TStartRequest extends GameStartRequest,
  TResponse extends GameResponse,
  TPlayerResponse extends GamePlayerResponse,
  TPlayer extends Player,
  TPlayResponse extends GamePlayResponse
> {
  constructor(
    protected readonly redisService: RedisService,
    protected readonly cardsService: CardsService,
    protected readonly idGeneratorService: IdGeneratorService
  ) {}

  protected GAME_KEY_PREFIX: string;
  protected readonly LEADER_KEY_PREFIX = 'leaderId';

  protected async saveGame(game: TGame): Promise<void> {
    const key = `${this.GAME_KEY_PREFIX}:${game.id}`;
    await this.redisService.set<TGame>(key, game);
  }

  abstract createGame(leaderId: string, type: string);

  protected async create(
    leaderId: string,
    type: string,
    GameClass: new(id?: string,
                     deck?: Card[],
                     leaderId?: string,
                     type?: string) => TGame
  ) {
    const leaderGames = await this.findByLeaderId(leaderId, GameClass);
    if(leaderGames.length > 0) {
      console.log(leaderGames)
      throw new UnauthorizedException(`Leader ${leaderId} already has an active game`);
    }
    const deck = this.cardsService.createDeck();
    const gameId =  await this.idGeneratorService.generateUniqueId('#', this.GAME_KEY_PREFIX);
    const game = new GameClass(gameId,deck,leaderId,type);
    game.addUser(leaderId)
    await this.saveGame(game);
    await this.redisService.sAdd(`${this.GAME_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`,[gameId]);
    return game;
  }

  protected async findByLeaderId(leaderId: string,
                                 GameClass: new(id?: string,
                                                  deck?: Card[],
                                                  leaderId?: string,
                                                  type?: string) => TGame ){
    const leaderKey = `${this.GAME_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`;
    const gameIds =  await this.redisService.getSet(leaderKey)

    return await Promise.all(
      gameIds.map((gameId) =>
        this.redisService.get(`${this.GAME_KEY_PREFIX}:${gameId}`, GameClass)
      )
    );
  }

  abstract join(gameId: string, playerId: string): Promise<string[]>;

  async joinGame(gameId: string, playerId: string,
                 GameClass: new(id?: string,
                                  deck?: Card[],
                                  leaderId?: string,
                                  type?: string) =>  TGame){
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game: TGame = await this.redisService.get<TGame>(key,GameClass)
      .then((game) => {
        if (!game) {
          throw new NotFoundException(`Game id ${gameId} not found`);
        }
        game.addUser(playerId);
        return game
      });
    await this.saveGame(game);
    console.log("New player joined: ", playerId);
    return game.players.map(player => player.id)
  }


  abstract play(client: Socket, gameAction: GameActionRequest) : Promise<TPlayResponse>;

  abstract mapResponse(player : TPlayer, players: string[]): { players: string[], response: TPlayerResponse };

  protected async playAction<TPlayResponse>(client: Socket, gameAction: GameActionRequest,
                             GameClass: new(id?: string,
                                              deck?: Card[],
                                              leaderId?: string,
                                              type?: string) => TGame,
                             mapResponse: (player: TPlayer, players: string[]) => {players: string[], response: TPlayerResponse}
  ): Promise<TPlayResponse>{
    return this.redisService
      .get<TGame>(`${this.GAME_KEY_PREFIX}:${gameAction.gameId}`,GameClass)
      .then((game) => {
        if (!game) {
          throw new NotFoundException(
            `Game id ${gameAction.gameId} not found`,
          );
        }
        const player = game.players.find(
          (player) => player.id === client.id,
        );
        if (!player) {
          throw new NotFoundException(`Player id ${client.id} not found`);
        }
        if (game.status != GameStatus.IN_PROGRESS){
          throw new NotFoundException(`Game hasn't started`);
        }
        let end = game.play(player, gameAction);
        this.saveGame(game);
        if (end) {
          end = this.checkEnd(game);
        }
        const players = game.players.map((player) => player.id);

        const response = mapResponse(player, players)
        return { players:response.players, end:end, response: response.response , game: game} as TPlayResponse;
      })
  }

  protected checkEnd(game: TGame): boolean {
    return true;
  }

  protected endRound(gameId: string,GameClass: new(id?: string,
                                    deck?: Card[],
                                    leaderId?: string,
                                    type?: string) => TGame){
    return this.redisService
      .get<TGame>(`${this.GAME_KEY_PREFIX}:${gameId}`,GameClass)
      .then((game) => {
        if (!game) {
          throw new NotFoundException(
            `Game id ${gameId} not found`,
          );
        }
        return game.endRound()
      })
  }

  abstract startGame(clientId: string, request: GameStartRequest): Promise<GameResponse>;

  abstract restartGame(clientId: string, request: GameStartRequest): Promise<GameResponse>;


  protected async start(clientId: string, gameId:string,
                                      GameClass: new(id?: string,
                                                       deck?: Card[],
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

    game.startGame(startRequest);
    await this.saveGame(game);

    return game.toResponse();

  }


  protected async restart(clientId: string, gameId:string,
                        GameClass: new(id?: string,
                                       deck?: Card[],
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
                                          deck?: Card[],
                                          leaderId?: string,
                                          type?: string) => TGame) {
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game: TGame = await this.redisService.get<TGame>(key,GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    return game;
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
                                                 deck?: Card[],
                                                 leaderId?: string,
                                                 type?: string) => TGame ): Promise<TGame> {
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game = await this.redisService.get<TGame>(key,GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    if (game.leaderId !== client.id) {
      throw new UnauthorizedException(`Only the leader can end the game`);
    }
    game.status = GameStatus.ENDED;
    return game;
  }
}