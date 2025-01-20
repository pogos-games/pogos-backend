import { Card } from '../../cards/model/card.interface';
import { PokerAction } from '../enum/poker-action.enum';
import { PokerType } from '../enum/poker-type.enum';
import { PokerResponse } from '../dto/response/poker-response.interface';
import { PokerPlayerResponse } from '../dto/response/poker-player-response.interface';
import { Expose, Type } from 'class-transformer';
import { Game, Player } from 'libs/tools/src/game/entities/game.entity';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';

export class PokerPlayer extends Player {
  id: string;
  username: string;
  hand: Card[];
  balance: number;
  bet: number;
  hasFolded: boolean;
  roundPlayed: boolean;
  allIn: number;
}

export class Poker extends Game<PokerResponse, PokerPlayer, PokerPlayerResponse> {
  @Expose()
  @Type(() => Card)
  private _river: Card[];

  @Expose()
  @Type(() => PokerPlayer)
  protected readonly _players: PokerPlayer[];

  @Expose()
  protected readonly _type: PokerType;

  @Expose()
  private _pot;

  @Expose()
  private _lastBet;

  constructor(
    id?: string,
    deck?: Card[],
    leaderId?: string,
    type?: string
  ) {
    super(id,deck,leaderId,type)
    this._river = [];
    this._players = [];
  }

  public get players(): PokerPlayer[] {
    return this._players;
}

  private get river() {
    return this._river;
  }

  private set river(value: Card[]) {
    this._river = value;
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
      hasFolded: false,
      allIn: 0,
    });
  }

  public startGame() {
    super.startGame()
    this._players.forEach((player) => {
      player.hand.push(this.drawCard(this.deck), this.drawCard(this.deck));
    });
  }

  public clearHands() {
    this.river = [];
    super.clearHands();
  }

  public play(player: PokerPlayer, action: PokerAction) {
    if (player.roundPlayed) {
      return;
    }
    switch (action) {
      case PokerAction.BET:
        this.raise(player);
        break;
      case PokerAction.ALL_IN:
        this.allIn(player);
        break;
      case PokerAction.CALL:
        this.call(player);
        break;
      case PokerAction.FOLD:
        this.fold(player);
        break;
      case PokerAction.CHECK:
        this.check(player);
        break;
      case PokerAction.RAISE:
        this.raise(player);
        break;
      default:
        console.log('No more actions available for the moment');
        console.log('Invalid action');
    }
    player.roundPlayed = true;
  }

  private raise(player){}

  private allIn(player){}

  private call(player){}

  private fold(player){}

  private check(player){}

  public toResponse(): PokerResponse {
    const players: PokerPlayerResponse[] = this._players.map((player) => ({
      playerId: player.id,
      hand: player.hand,
      balance: player.balance,
      bet: player.bet,
      roundPlayed: player.roundPlayed,
      allIn: player.allIn,
    }));

    return {
      gameId: this._id,
      river: this._river,
      players: players,
      pot: this._pot,
      lastBet: this._lastBet,
      status: this._status,
    } as PokerResponse;
  }
}
