import { Card } from '../../cards/model/card.interface';
import { BlackJackStatus } from '../enum/black-jack-status.enum';
import { BlackJackAction } from '../enum/black-jack-action.enum';

export interface BlackJackPlayer {
  id:string;
  username:string
  hand: Card[];
  balance: number;
  bet: number;
  isStanding: boolean;
  roundPlayed: boolean;
}

export class Blackjack {

  private readonly _id: string;
  private readonly _deck: Card[];
  private readonly _leaderId: string;
  private _status:BlackJackStatus
  private _dealerHand: Card[];
  private _players: BlackJackPlayer[];

  constructor(deck: Card[], leaderId: string) {
    this._status = BlackJackStatus.WAITING;
    this._deck = deck;
    this._dealerHand = [];
    this._leaderId = leaderId;
  }

  public get id(): string {
    return this._id;
  }

  public get status(): BlackJackStatus {
    return this._status;
  }

  public set status(value: BlackJackStatus) {
    this._status = value;
  }

  public get players(): BlackJackPlayer[] {
    return this._players;
  }

  public get deck(): Card[] {
    return this._deck;
  }

  public get dealerHand() {
    return this._dealerHand;
  }

  private set dealerHand(value: Card[]) {
    this._dealerHand = value;
  }

  public get leaderId(): string {
    return this._leaderId;
  }

  public addUser(userId:string){
    if(this.status !== BlackJackStatus.WAITING) {
      throw new Error('Cannot add user to a game that has already started');
    }
    this._players.push({
      id: userId,
      username: 'not defined',
      hand: [],
      balance: 1000,
      bet: 0,
      roundPlayed: false,
      isStanding: false
    });
  }



  public drawCard(deck: Card[]): Card {
    return deck.pop();
  }

  public startGame() {
    this._status = BlackJackStatus.IN_PROGRESS;
    this.clearHands();
    this._players.forEach(player => {
      player.hand.push(this.drawCard(this.deck), this.drawCard(this.deck));
    });
    this.dealerHand.push(this.drawCard(this.deck), this.drawCard(this.deck));
  }

  public clearHands(){
    this.dealerHand = [];
    this._players.forEach(player => {
      player.hand = [];
    });
  }

  public play(player: BlackJackPlayer, action: BlackJackAction) {
    if(player.roundPlayed) {
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
        console.log("No more actions available for the moment");
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
