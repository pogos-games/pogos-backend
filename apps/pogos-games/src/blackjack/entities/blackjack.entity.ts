import { Card } from '../../cards/model/card.interface';
import { BlackJackAction } from '../enum/black-jack-action.enum';
import { BlackjackType } from '../enum/blackjack-type.enum';
import { BlackjackResponse } from '../dto/response/blackjack-response.interface';
import { BlackjackPlayerResponse } from '../dto/response/blackjack-player-response.interface';
import { Expose, Type } from 'class-transformer';
import { Game, Player } from 'libs/tools/src/game/entities/game.entity';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';

export class BlackJackPlayer extends Player {
  id: string;
  username: string;
  hand: Card[];
  balance: number;
  bet: number;
  isStanding: boolean;
  roundPlayed: boolean;
}

export class Blackjack extends Game {
  @Expose()
  @Type(() => Card)
  private _dealerHand: Card[];

  @Expose()
  @Type(() => BlackJackPlayer)
  protected readonly _players: BlackJackPlayer[];

  @Expose()
  private readonly _type: BlackjackType;

  constructor(id:string,deck: Card[], leaderId: string, type: BlackjackType) {
    super(id,deck,leaderId)
    this._dealerHand = [];
    this._players = [];
    this._type = type;
  }

  public get type(): BlackjackType {
    return this._type;
  }

  public get players(): BlackJackPlayer[] {
    return this._players;
}

  public get dealerHand() {
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
      balance: 1000,
      bet: 0,
      roundPlayed: false,
      isStanding: false,
    });
  }

  public startGame() {
    super.startGame()
    this._players.forEach((player) => {
      player.hand.push(this.drawCard(this.deck), this.drawCard(this.deck));
    });
    this.dealerHand.push(this.drawCard(this.deck), this.drawCard(this.deck));
  }

  public clearHands() {
    this.dealerHand = [];
    super.clearHands();
  }

  public play(player: BlackJackPlayer, action: BlackJackAction) {
    if (player.roundPlayed) {
      return;
    }
    switch (action) {
      case BlackJackAction.HIT:
        this.hit(player);
        break;
      case BlackJackAction.STAND:
        this.stand(player);
        break;
      default:
        console.log('No more actions available for the moment');
        console.log('Invalid action');
    }
    player.roundPlayed = true;
  }

  private hit(player: BlackJackPlayer) {
    player.hand.push(this.drawCard(this.deck));
  }

  private stand(player: BlackJackPlayer) {
    player.isStanding = true;
  }

  public toResponse(): BlackjackResponse {
    const players: BlackjackPlayerResponse[] = this._players.map((player) => ({
      playerId: player.id,
      hand: player.hand,
      balance: player.balance,
      bet: player.bet,
      roundPlayed: player.roundPlayed,
    }));

    return {
      gameId: this._id,
      dealerHand: this._dealerHand,
      players: players,
      status: this._status,
    };
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
}
