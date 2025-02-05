import { Card } from '../../cards/model/card.interface';
import { BlackJackAction } from '../enum/black-jack-action.enum';
import { BlackjackType } from '../enum/blackjack-type.enum';
import { BlackjackResponse } from '../dto/response/blackjack-response.interface';
import { BlackjackPlayerResponse } from '../dto/response/blackjack-player-response.interface';
import { Expose, Type } from 'class-transformer';
import { Game, Player } from 'libs/tools/src/game/entities/game.entity';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';
import { BlackjackActionRequest } from '../dto/request/blackjack-action-request.interface';
import * as console from 'console';
import { GameEndResponse } from '../../../../../libs/tools/src/game/dto/response/game-end-response.interface';

export class BlackJackPlayer extends Player {
  id: string;
  username: string;
  hand: Card[][]
  currentHandId: number;
  balance: number;
  bet: number;
  isStanding: boolean;
  roundPlayed: boolean;
}

export class Blackjack extends Game<BlackjackResponse, BlackJackPlayer, BlackjackPlayerResponse> {
  @Expose()
  @Type(() => Card)
  private _dealerHand: Card[];

  @Expose()
  @Type(() => BlackJackPlayer)
  protected readonly _players: BlackJackPlayer[];

  constructor(
    id?: string,
    deck?: Card[],
    leaderId?: string,
    type?: BlackjackType
  ) {
    super(id,deck,leaderId, type)
    this._dealerHand = [];
    this._players = [];
  }

  public get players(): BlackJackPlayer[] {
    return this._players;
}

  private get dealerHand() {
    return this._dealerHand;
  }

  private set dealerHand(value: Card[]) {
    this._dealerHand = value;
  }


  public addUser(userId: string) {
    if (this.status !== GameStatus.WAITING) {
      throw new Error('Cannot add user to a game that has already started');
    }
    this._players.push({
      id: userId,
      username: 'not defined',
      hand: [],
      currentHandId: 0,
      balance: 1000,
      bet: 0,
      roundPlayed: false,
      isStanding: false,
    });
  }

  public startGame() {
    super.startGame()
    this._players.forEach((player) => {
      player.hand.push([this.drawCard(this.deck), this.drawCard(this.deck)]);
    });
    this.dealerHand.push(this.drawCard(this.deck), this.drawCard(this.deck));
  }

  public clearHands() {
    this.dealerHand = [];
    this._players.forEach((player) => {
      player.currentHandId = 0;
    });
    this._players.forEach((player) => {
      player.hand = [];
    });
  }

  public play(player: BlackJackPlayer, action: BlackjackActionRequest): boolean {
    if (player.roundPlayed) {
      return false;
    }
    player.roundPlayed = true;
    switch (action.action) {
      case BlackJackAction.HIT:
        this.hit(player);
        return false;
      case BlackJackAction.STAND:
        this.stand(player);
        return true;
      case BlackJackAction.DOUBLE_DOWN:
        this.doubleDown(player);
        return false;
      case BlackJackAction.SPLIT:
        this.split(player);
        return false;
      default:
        console.log('No more actions available for the moment');
        console.log('Invalid action');
    }
    return false;
  }

  private hit(player: BlackJackPlayer) {
    player.hand[player.currentHandId].push(this.drawCard(this.deck));
  }

  private stand(player: BlackJackPlayer) {
    player.currentHandId += 1
    if (player.currentHandId == player.hand.length) {
      player.isStanding = true;
      player.currentHandId = 0;
    }
  }

  private doubleDown(player: BlackJackPlayer){
    player.bet += player.bet
    this.hit(player)
    this.stand(player)
  }

  private split(player: BlackJackPlayer){
    const card: Card = player.hand[player.currentHandId].pop()
    player.currentHandId += 1;
    player.hand.push([card])
  }

  public toResponse(): BlackjackResponse {
    const players: BlackjackPlayerResponse[] = this._players.map((player) => ({
      playerId: player.id,
      hand: player.hand,
      currentHandId: player.currentHandId,
      balance: player.balance,
      bet: player.bet,
      roundPlayed: player.roundPlayed,
    }));

    return {
      gameId: this._id,
      dealerHand: this._dealerHand,
      players: players,
      status: this._status,
    } as BlackjackResponse;
  }

  private calculateHandValue(hand: Card[]): number {
    let value = 0;
    let aceCount = 0;

    for (const card of hand) {
      if (card.rank === 'A') {
        value += 11;
        aceCount++;
      } else if (['K', 'Q', 'J'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    }
    while (value > 21 && aceCount > 0) {
      value -= 10;
      aceCount--;
    }
    return value;
  }

  endRound(): GameEndResponse {
    return undefined;
  }
}
