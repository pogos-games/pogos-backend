import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Poker, PokerPlayer } from './entities/poker.entity';
import { PokerActionRequest } from './dto/request/poker-action-request.interface';
import { PokerPlayerResponse } from './dto/response/poker-player-response.interface';
import { GameService } from '../../../../libs/tools/src/game/game.service';
import { PokerResponse } from './dto/response/poker-response.interface';
import { RedisService } from '../../../../libs/tools-library/src/redis/redis.service';
import { CardsService } from '../cards/cards.service';
import { IdGeneratorService } from '../../../../libs/tools-library/src/id-generator.service';
import { GameStartRequest } from '../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { PokerPlayResponse } from './dto/response/poker-play-response.interface';
import { Card } from '../cards/model/card.interface';
import { GameCreationRequest } from '../../../../libs/tools/src/game/dto/request/game-creation-request.class';
import { GameJoinRequest } from '../../../../libs/tools/src/game/dto/request/game-join-request.class';
import { GameMode } from '../../../../libs/tools/src/game/enum/game-mode.enum';

@Injectable()
export class PokerService extends GameService<Poker, GameStartRequest, PokerResponse, PokerPlayerResponse, PokerPlayer, PokerPlayResponse, Card> {
  protected GAME_KEY_PREFIX = 'poker';

  constructor(
    protected readonly redisService: RedisService,
    protected readonly cardsService: CardsService,
    protected readonly idGeneratorService: IdGeneratorService
  ) {super(redisService,cardsService,idGeneratorService)}
  async createGame(leaderId: string, creationRequest: GameCreationRequest) {
    return (await super.create(leaderId, creationRequest, Poker)).toResponse()
  }

  async join(joinRequest: GameJoinRequest, playerId: string){
    return await super.joinGame(joinRequest, playerId, Poker);
  }

  async quit(gameId: string, playerId: string){
    return await super.quitGame(gameId, playerId, Poker);
  }

  /**
   * End the game
   * @param client the client that is ending the game
   * @param pokerAction
   * @returns list of player ids
   */

  async play(
    client: Socket,
    pokerAction: PokerActionRequest
  ): Promise<PokerPlayResponse> {
    return super.playAction<PokerPlayResponse>(
      client,
      pokerAction,
      Poker,
      this.mapResponse
    );
  }


  mapResponse<PokerPlayerResponse>(player: PokerPlayer, players: string[]): { players: string[], response: PokerPlayerResponse } {
    return {
      players,
      response: {
        playerId: player.id,
        balance: player.balance,
        roundPlayed: player.roundPlayed,
        allIn: player.allIn,
      } as PokerPlayerResponse,
    };
  }

  async startGame<PokerResponse>(clientId: string, request: GameStartRequest) {
    if (Object.values(GameMode).includes(request.mode)) {
      return await this.start(clientId, request.gameId, Poker, request) as PokerResponse;
    } else {
      throw new Error('Wrong game type');
    }
  }

  restartGame(clientId: string, request: GameStartRequest): Promise<PokerResponse> {
    return this.startGame(clientId, request)
  }

  async persistGameToHistory(gameId: string): Promise<void> {
    await this.persistGameHistory(gameId, Poker)
  }

  async getGame(gameId: string){
    return this.findGame(gameId, Poker)
  };
}
