import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Blackjack, BlackJackPlayer } from './entities/blackjack.entity';
import { BlackjackActionRequest } from './dto/request/blackjack-action-request.interface';
import { BlackjackPlayerResponse } from './dto/response/blackjack-player-response.interface';
import { BlackjackType } from './enum/blackjack-type.enum';
import { GameService } from '../../../../libs/tools/src/game/game.service';
import { BlackjackResponse } from './dto/response/blackjack-response.interface';
import { RedisService } from '../../../../libs/tools-library/src/redis/redis.service';
import { CardsService } from '../cards/cards.service';
import { IdGeneratorService } from '../../../../libs/tools-library/src/id-generator.service';
import { GameStartRequest } from '../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { BlackJackPlayResponse } from './dto/response/blackjack-play-response.interface';

@Injectable()
export class BlackjackService extends GameService<Blackjack, BlackjackResponse, BlackjackPlayerResponse, BlackJackPlayer, BlackJackPlayResponse> {
  protected GAME_KEY_PREFIX = 'blackjack';

  constructor(
    protected readonly redisService: RedisService,
    protected readonly cardsService: CardsService,
    protected readonly idGeneratorService: IdGeneratorService
  ) {super(redisService,cardsService,idGeneratorService)}
  async createGame(leaderId: string,type:BlackjackType) {
    const game = await super.create(leaderId, type, Blackjack)
    return game.id;
  }

  async join(gameId: string, playerId: string){
    return await super.joinGame(gameId, playerId, Blackjack);
  }

  protected checkEnd(game: Blackjack): boolean {
    return game.players.every(player => player.isStanding == true);
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

  async startGame<BlackjackResponse>(clientId: string, request: GameStartRequest) {
    if (Object.values(BlackjackType).includes(request.type as BlackjackType)) {
      return await this.start(clientId, request.gameId, Blackjack) as BlackjackResponse;
    } else {
      throw new Error('Wrong game type');
    }
  }

  // endGame(client: Socket) {
  //   this.games.delete(client.id);
  // }

  // restartGame(clientId: string): BlackjackDeckResponse {
  //   this.clearHands(clientId);
  //   return this.startGame(clientId);
  // }

  // hit(clientId: string): BlackjackDeckResponse {
  //   const game = this.games.get(clientId);
  //   const card = this.drawCard(game.deck);
  //   game.playerHand.push(card);
  //   const playerTotal = this.calculateHandValue(game.playerHand);
  //   this.calculateHandValue(game.dealerHand);
  //   const message =
  //     playerTotal > 21
  //       ? BlackJackMessage.PLAYER_BUST
  //       : BlackJackMessage.CONTINUE;
  //
  //   const response = {
  //     playerHand: game.playerHand,
  //     dealerHand: game.dealerHand,
  //     playerTotal,
  //     message,
  //   };
  //
  //   if (message === BlackJackMessage.PLAYER_BUST) {
  //     this.clearHands(clientId);
  //   }
  //
  //   return response;
  // }
  //
  // stand(clientId: string): BlackjackDeckResponse {
  //   const game = this.games.get(clientId);
  //
  //   let dealerTotal = this.calculateHandValue(game.dealerHand);
  //   while (dealerTotal < 17) {
  //     game.dealerHand.push(this.drawCard(game.deck));
  //     dealerTotal = this.calculateHandValue(game.dealerHand);
  //   }
  //
  //   const playerTotal = this.calculateHandValue(game.playerHand);
  //   let result: BlackJackMessage;
  //   if (dealerTotal > 21) {
  //     result = BlackJackMessage.DEALER_BUST;
  //   } else if (playerTotal > dealerTotal) {
  //     result = BlackJackMessage.PLAYER_WIN;
  //   } else if (playerTotal < dealerTotal) {
  //     result = BlackJackMessage.DEALER_WIN;
  //   } else {
  //     result = BlackJackMessage.TIE;
  //   }
  //
  //   const response = {
  //     playerHand: game.playerHand,
  //     dealerHand: game.dealerHand,
  //     playerTotal,
  //     message: result,
  //   };
  //
  //   if (
  //     result === BlackJackMessage.DEALER_BUST ||
  //     result === BlackJackMessage.PLAYER_WIN ||
  //     result === BlackJackMessage.DEALER_WIN ||
  //     result === BlackJackMessage.TIE
  //   ) {
  //     this.clearHands(clientId);
  //   }
  //
  //   return response;
  // }
  //
  // private drawCard(deck: Card[]): Card {
  //   return deck.pop();
  // }
  //
  // private getRankValue(rank: string): number {
  //   if (['K', 'Q', 'J'].includes(rank)) {
  //     return 10;
  //   } else if (rank === 'A') {
  //     return 11;
  //   } else {
  //     return parseInt(rank);
  //   }
  // }
  //
  // private calculateHandValue(hand: Card[]): number {
  //   let value = 0;
  //   let aceCount = 0;
  //
  //   for (const card of hand) {
  //     if (card.rank === 'A') {
  //       value += 11;
  //       aceCount++;
  //     } else if (['K', 'Q', 'J'].includes(card.rank)) {
  //       value += 10;
  //     } else {
  //       value += parseInt(card.rank);
  //     }
  //   }
  //   while (value > 21 && aceCount > 0) {
  //     value -= 10;
  //     aceCount--;
  //   }
  //   return value;
  // }
  //
  // clearHands(clientId: string) {
  //   const game = this.games.get(clientId);
  //   game.playerHand = [];
  //   game.dealerHand = [];
  //   //game.deck = this.createDeck();
  // }
}
