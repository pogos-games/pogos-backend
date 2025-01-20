import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Poker, PokerPlayer } from './entities/poker.entity';
import { PokerActionRequest } from './dto/request/poker-action-request.interface';
import { PokerPlayerResponse } from './dto/response/poker-player-response.interface';
import { PokerType } from './enum/poker-type.enum';
import { GameService } from '../../../../libs/tools/src/game/game.service';
import { PokerResponse } from './dto/response/poker-response.interface';

@Injectable()
export class PokerService extends GameService<Poker, PokerResponse, PokerPlayerResponse, PokerPlayer> {
  protected GAME_KEY_PREFIX = 'poker';

  async createGame(leaderId: string,type:PokerType) {
    const game = await super.create(leaderId, type, Poker)
    return game.id;
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
  ): Promise<{ players: string[], response: PokerPlayerResponse }> {
    return super.playAction(
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
        hand: player.hand,
        balance: player.balance,
        bet: player.bet,
        roundPlayed: player.roundPlayed,
        allIn: player.allIn,
      } as PokerPlayerResponse,
    };
  }

  async startGame<PokerResponse>(clientId: string, gameId: string) {
    return await this.start(clientId, gameId, Poker) as PokerResponse;
  }



  // endGame(client: Socket) {
  //   this.games.delete(client.id);
  // }

  // restartGame(clientId: string): PokerDeckResponse {
  //   this.clearHands(clientId);
  //   return this.startGame(clientId);
  // }

  // hit(clientId: string): PokerDeckResponse {
  //   const game = this.games.get(clientId);
  //   const card = this.drawCard(game.deck);
  //   game.playerHand.push(card);
  //   const playerTotal = this.calculateHandValue(game.playerHand);
  //   this.calculateHandValue(game.dealerHand);
  //   const message =
  //     playerTotal > 21
  //       ? PokerMessage.PLAYER_BUST
  //       : PokerMessage.CONTINUE;
  //
  //   const response = {
  //     playerHand: game.playerHand,
  //     dealerHand: game.dealerHand,
  //     playerTotal,
  //     message,
  //   };
  //
  //   if (message === PokerMessage.PLAYER_BUST) {
  //     this.clearHands(clientId);
  //   }
  //
  //   return response;
  // }
  //
  // stand(clientId: string): PokerDeckResponse {
  //   const game = this.games.get(clientId);
  //
  //   let dealerTotal = this.calculateHandValue(game.dealerHand);
  //   while (dealerTotal < 17) {
  //     game.dealerHand.push(this.drawCard(game.deck));
  //     dealerTotal = this.calculateHandValue(game.dealerHand);
  //   }
  //
  //   const playerTotal = this.calculateHandValue(game.playerHand);
  //   let result: PokerMessage;
  //   if (dealerTotal > 21) {
  //     result = PokerMessage.DEALER_BUST;
  //   } else if (playerTotal > dealerTotal) {
  //     result = PokerMessage.PLAYER_WIN;
  //   } else if (playerTotal < dealerTotal) {
  //     result = PokerMessage.DEALER_WIN;
  //   } else {
  //     result = PokerMessage.TIE;
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
  //     result === PokerMessage.DEALER_BUST ||
  //     result === PokerMessage.PLAYER_WIN ||
  //     result === PokerMessage.DEALER_WIN ||
  //     result === PokerMessage.TIE
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
