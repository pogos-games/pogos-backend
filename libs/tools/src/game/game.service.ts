import { CardsService } from "apps/pogos-games/src/cards/cards.service";
import { RedisService } from "../redis/redis.service";
import { IdGeneratorService } from "../id-generator.service";
import { Game } from "./entities/game.entity";
import { GameActionRequest } from "./dto/request/game-action-request.interface";
import { GameResponse } from "./dto/response/game-response.interface";
import { GamePlayerResponse } from "./dto/response/game-player-response.interface";
import { Socket } from 'socket.io';

export abstract class GameService {

  constructor(
    protected readonly redisService: RedisService,
    protected readonly cardsService: CardsService,
    protected readonly idGeneratorService:IdGeneratorService
  ) {}

  protected readonly GAME_KEY_PREFIX = 'game';
  protected readonly LEADER_KEY_PREFIX = 'leaderId';

  protected abstract saveGame(game: Game): Promise<void>;

  abstract createGame(leaderId: string, type: string);

  protected abstract findByLeaderId(leaderId: string): Promise<Game[]>;


  abstract joinGame(gameId: string, playerId: string);

  /**
   * End the game
   * @param client the client that is ending the game
   * @param gameId id of the game to end
   * @returns list of player ids
   */
  abstract endGame(client: Socket, gameId: string): Promise<string[]>;

  abstract play(client: Socket, blackjackAction: GameActionRequest) : Promise<{ players: string[], response: GamePlayerResponse }>;

  abstract startGame(clientId: string, gameId:string) : Promise<GameResponse>;
}