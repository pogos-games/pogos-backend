import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Blackjack, BlackJackPlayer } from './entities/blackjack.entity';
import { BlackjackActionRequest } from './dto/request/blackjack-action-request.interface';
import { BlackjackPlayerResponse } from './dto/response/blackjack-player-response.interface';
import { GameService } from '../../../../libs/tools/src/game/game.service';
import { BlackjackResponse } from './dto/response/blackjack-response.interface';
import { RedisService } from '../../../../libs/tools-library/src/redis/redis.service';
import { CardsService } from '../cards/cards.service';
import { IdGeneratorService } from '../../../../libs/tools-library/src/id-generator.service';
import { BlackJackPlayResponse } from './dto/response/blackjack-play-response.interface';
import { BlackjackStartRequest } from './dto/request/blackjack-start-request.class';
import { GameMode } from '../../../../libs/tools/src/game/enum/game-mode.enum';
import { Card } from '../cards/model/card.interface';
import { GameCreationRequest } from '../../../../libs/tools/src/game/dto/request/game-creation-request.class';
import { GameJoinRequest } from '../../../../libs/tools/src/game/dto/request/game-join-request.class';

@Injectable()
export class BlackjackService extends GameService<Blackjack, BlackjackStartRequest, BlackjackResponse, BlackjackPlayerResponse, BlackJackPlayer, BlackJackPlayResponse, Card> {
  protected GAME_KEY_PREFIX = 'blackjack';

  constructor(
    protected readonly redisService: RedisService,
    protected readonly cardsService: CardsService,
    protected readonly idGeneratorService: IdGeneratorService
  ) {super(redisService,cardsService,idGeneratorService)}
  async createGame(leaderId: string, creationRequest: GameCreationRequest) {
    return (await super.create(leaderId, creationRequest, Blackjack)).toResponse()
  }

  async join(joinRequest: GameJoinRequest, playerId: string){
    return await super.joinGame(joinRequest, playerId, Blackjack);
  }

  async quit(gameId: string, playerId: string){
    return await super.quitGame(gameId, playerId, Blackjack);
  }

  protected checkEnd(game: Blackjack): boolean {
    return game.players.every(player => player.isStanding);
  }

  async play(
    client: Socket,
    blackjackAction: BlackjackActionRequest
  ): Promise<BlackJackPlayResponse> {
    return this.playAction<BlackJackPlayResponse>(
      client,
      blackjackAction,
      Blackjack,
      this.mapResponse
    );
  }


  mapResponse<BlackjackPlayerResponse>(player: BlackJackPlayer, players: string[]): { players: string[], response: BlackjackPlayerResponse } {
    return {
      players,
      response: {
        playerId: player.id,
        hand: player.hand,
        balance: player.balance,
        bet: player.bet,
        roundPlayed: player.roundPlayed,
        currentHandId: player.currentHandId,
      } as BlackjackPlayerResponse,
    };
  }

  async startGame<BlackjackResponse>(clientId: string, request: BlackjackStartRequest) {
    if (Object.values(GameMode).includes(request.mode)) {
      return await this.start(clientId, request.gameId, Blackjack, request) as BlackjackResponse;
    } else {
      throw new Error('Wrong game type');
    }
  }

  async restartGame<BlackjackResponse>(clientId: string, request: BlackjackStartRequest) {
    if (Object.values(GameMode).includes(request.mode)) {
      return await this.restart(clientId, request.gameId, Blackjack, request) as BlackjackResponse;
    } else {
      throw new Error('Wrong game type');
    }
  }

  async persistGameToHistory(gameId: string): Promise<void> {
    await this.persistGameHistory(gameId, Blackjack)
  }

  async getGame(gameId: string){
    return this.findGame(gameId, Blackjack)
  };
}
