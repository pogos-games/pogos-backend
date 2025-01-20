import { CardsService } from "apps/pogos-games/src/cards/cards.service";
import { RedisService } from '../../../tools-library/src/redis/redis.service';
import { IdGeneratorService } from '../../../tools-library/src/id-generator.service';
import { Game, Player } from './entities/game.entity';
import { GameActionRequest } from "./dto/request/game-action-request.interface";
import { GameResponse } from "./dto/response/game-response.interface";
import { GamePlayerResponse } from "./dto/response/game-player-response.interface";
import { Socket } from 'socket.io';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GameStatus } from './enum/game-status.enum';

export abstract class GameService<
  TGame extends Game<TResponse, TPlayer, TPlayerResponse> & { new (...args: any[])},
  TResponse extends GameResponse,
  TPlayerResponse extends GamePlayerResponse,
  TPlayer extends Player
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
    GameClass: TGame
  ) {
    const leaderPokers = await this.findByLeaderId(leaderId, GameClass);
    if(leaderPokers.length > 0) {
      throw new UnauthorizedException(`Leader ${leaderId} already has an active game`);
    }
    const deck = this.cardsService.createDeck();
    const gameId =  await this.idGeneratorService.generateUniqueId('#', this.GAME_KEY_PREFIX);
    const game = new GameClass(gameId,deck, leaderId, type);
    game.addUser(leaderId)
    await this.saveGame(game);
    await this.redisService.sAdd(`${this.GAME_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`,[gameId]);
    return game;
  }

  protected async findByLeaderId(leaderId: string,
                                 GameClass: TGame){
    const leaderKey = `${this.GAME_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`;
    const gameIds =  await this.redisService.getSet(leaderKey)

    return await Promise.all(
      gameIds.map((gameId) =>
        this.redisService.get(`${this.GAME_KEY_PREFIX}:${gameId}`, GameClass)
      )
    );
  }

  async joinGame(gameId: string, playerId: string,
                 GameClass: TGame){
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game: TGame = await this.redisService.get<TGame>(key,GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    game.addUser(playerId);
    await this.saveGame(game);
  }


  abstract play(client: Socket, gameAction: GameActionRequest) : Promise<{ players: string[], response: GamePlayerResponse }>;

  abstract mapResponse(player : TPlayer, players: string[]): { players: string[], response: TPlayerResponse };

  protected async playAction(client: Socket, gameAction: GameActionRequest,
                             GameClass: TGame,
                             mapResponse: (player: TPlayer, players: string[]) => {players: string[], response: TPlayerResponse}
  ): Promise<{ players: string[], response: TPlayerResponse }> {
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
        game.play(player, gameAction.action);
        this.saveGame(game);
        const players = game.players.map((player) => player.id);

        return mapResponse(player, players);
      })
  }


  abstract startGame<TResponse>(clientId: string, gameId: string): Promise<TResponse>;


  protected async start(clientId: string, gameId:string,
                                      GameClass: TGame) {
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game: TGame = await this.redisService.get<TGame>(key,GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    console.log("game : ",game);
    console.log("game leader id : ",game.leaderId);
    if (game.leaderId !== clientId) {
      throw new UnauthorizedException(`Only the leader can start the game`);
    }

    game.startGame();
    await this.saveGame(game);

    // map to blackjackResponse :
    return game.toResponse();

  }
  /**
   * End the game
   * @param client the client that is ending the game
   * @param gameId id of the game to end
   * @param GameClass
   * @returns list of player ids
   */
  async endGame(client: Socket, gameId: string,
                                GameClass: TGame): Promise<string[]> {
    const key = `${this.GAME_KEY_PREFIX}:${gameId}`;
    const game = await this.redisService.get<TGame>(key,GameClass);
    if (!game) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    if (game.leaderId !== client.id) {
      throw new UnauthorizedException(`Only the leader can end the game`);
    }
    game.status = GameStatus.ENDED;
    return game.players.map((player) => player.id);
  }
}