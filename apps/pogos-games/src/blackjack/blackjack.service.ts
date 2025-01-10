import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { Blackjack } from './entities/blackjack.entity';
import { BlackjackActionRequest } from './dto/request/blackjack-action-request.interface';
import { BlackjackPlayerResponse } from './dto/response/blackjack-player-response.interface';
import { BlackjackType } from './enum/blackjack-type.enum';
import { BlackjackResponse } from './dto/response/blackjack-response.interface';
import { GameStatus } from '../../../../libs/tools/src/game/enum/game-status.enum';
import { GameService } from '../../../../libs/tools/src/game/game.service';

@Injectable()
export class BlackjackService extends GameService{
  protected readonly BLACKJACK_KEY_PREFIX = 'blackjack';
  protected readonly LEADER_KEY_PREFIX = 'leaderId';

  protected async saveGame(blackjack: Blackjack): Promise<void> {
    const key = this.BLACKJACK_KEY_PREFIX + ":" +blackjack.id;
    await this.redisService.set<Blackjack>(key, blackjack);
    return;
  }

  async createGame(leaderId: string,type:BlackjackType) {
    const leaderBlackjacks = await this.findByLeaderId(leaderId);
    if(leaderBlackjacks.length > 0) {
      throw new UnauthorizedException(`Leader ${leaderId} already has an active game`);
    }
    const deck = this.cardsService.createBlackjackDeck();
    const gameId =  await this.idGeneratorService.generateUniqueId('#', this.BLACKJACK_KEY_PREFIX);
    const blackjack = new Blackjack(gameId,deck, leaderId,type);
    blackjack.addUser(leaderId);
    await this.saveGame(blackjack);
    await this.redisService.sAdd(`${this.BLACKJACK_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`,[gameId]);
    return gameId;
  }

  protected async findByLeaderId(leaderId: string): Promise<Blackjack[]> {
    const leaderKey = `${this.BLACKJACK_KEY_PREFIX}:${this.LEADER_KEY_PREFIX}:${leaderId}`;
    const gameIds =  await this.redisService.getSet(leaderKey)

    return await Promise.all(
      gameIds.map(gameId => this.redisService.get<Blackjack>(`${this.BLACKJACK_KEY_PREFIX}:${gameId}`,Blackjack)),
    );
  }


  async joinGame(gameId: string, playerId: string) {
    const key = `blackjack:${gameId}`;
    const blackjack: Blackjack = await this.redisService.get<Blackjack>(key,Blackjack);
    if (!blackjack) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    blackjack.addUser(playerId);
    await this.saveGame(blackjack);
  }

  /**
   * End the game
   * @param client the client that is ending the game
   * @param gameId id of the game to end
   * @returns list of player ids
   */
  async endGame(client: Socket, gameId: string): Promise<string[]> {
    const key = `blackjack:${gameId}`;
    const blackjack: Blackjack = await this.redisService.get<Blackjack>(key,Blackjack);
    if (!blackjack) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    if (blackjack.leaderId !== client.id) {
      throw new UnauthorizedException(`Only the leader can end the game`);
    }
    blackjack.status = GameStatus.ENDED;
    return blackjack.players.map((player) => player.id);
  }

  async play(client: Socket, blackjackAction: BlackjackActionRequest) : Promise<{ players: string[], response: BlackjackPlayerResponse }> {
    return this.redisService
      .get<Blackjack>(`blackjack:${blackjackAction.gameId}`,Blackjack)
      .then((blackjack: Blackjack) => {
        if (!blackjack) {
          throw new NotFoundException(
            `Game id ${blackjackAction.gameId} not found`,
          );
        }
        let player = blackjack.players.find(
          (player) => player.id === client.id,
        );
        if (!player) {
          throw new NotFoundException(`Player id ${client.id} not found`);
        }
        blackjack.play(player, blackjackAction.action);
        this.saveGame(blackjack);
        const players = blackjack.players.map((player) => player.id);

        return {
          players,
          response: {
          playerId: player.id,
          hand: player.hand,
          balance: player.balance,
          bet: player.bet,
        } as BlackjackPlayerResponse }});
  }

  async startGame(clientId: string, gameId:string) : Promise<BlackjackResponse> {
    const key = `blackjack:${gameId}`;
    const blackjack: Blackjack = await this.redisService.get<Blackjack>(key,Blackjack);
    if (!blackjack) {
      throw new NotFoundException(`Game id ${gameId} not found`);
    }
    console.log("blackjack : ",blackjack);
    console.log("blackjack leader id : ",blackjack.leaderId);
    if (blackjack.leaderId !== clientId) {
      throw new UnauthorizedException(`Only the leader can start the game`);
    }

    blackjack.startGame();
    await this.saveGame(blackjack);

    // map to blackjackResponse :
    return blackjack.toResponse();

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
