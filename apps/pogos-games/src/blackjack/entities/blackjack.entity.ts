import { Card } from '../../cards/model/card.interface';
import { BlackJackAction } from '../enum/black-jack-action.enum';
import { BlackjackResponse } from '../dto/response/blackjack-response.interface';
import { BlackjackPlayerResponse } from '../dto/response/blackjack-player-response.interface';
import { Expose, Type } from 'class-transformer';
import { Game, Player } from 'libs/tools/src/game/entities/game.entity';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';
import { BlackjackActionRequest } from '../dto/request/blackjack-action-request.interface';
import { GameEndResponse } from '../../../../../libs/tools/src/game/dto/response/game-end-response.interface';
import { BlackjackStartRequest } from '../dto/request/blackjack-start-request.class';
import { Avatar } from '../../../../../libs/tools/src/game/enum/avatar.enum';

export class BlackJackPlayer extends Player {
  hand: Card[][]
  currentHandId: number;
  balance: number;
  bet: number;
  isStanding: boolean;
  roundPlayed: boolean;
}

export class Blackjack extends Game<BlackjackResponse, BlackjackStartRequest, BlackJackPlayer, BlackjackPlayerResponse, Card> {
  @Expose()
  @Type(() => Card)
  private _dealerHand: Card[];

  @Expose()
  @Type(() => BlackJackPlayer)
  _players: BlackJackPlayer[];

  constructor(id?: string, deck?: Card[], leaderId?: string, type?: GameMode) {
    super(id, deck, leaderId, type);
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


  public addUser(userId: string, avatar: Avatar, playerName: string) {
    if (this._status !== GameStatus.WAITING) {
      throw new Error('Cannot add user to a game that has already started');
    }
    this._players.push({
      avatar: avatar,
      id: userId,
      username: playerName,
      hand: [],
      currentHandId: 0,
      balance: 1000,
      bet: 0,
      roundPlayed: false,
      isStanding: false
    });
  }

  public startGame(request: BlackjackStartRequest) {
    super.startGame(request);
    this._players.forEach((player) => {
      player.hand.push([this.drawCard(this.deck), this.drawCard(this.deck)]);
      player.bet = request.bet;
      player.balance -= request.bet;
      if (this.calculateHandValue(player.hand[player.currentHandId]) == 21) {
        this.stand(player);
      }
    });
    this.dealerHand.push(this.drawCard(this.deck), this.drawCard(this.deck));
  }

  public restartGame(request: BlackjackStartRequest) {
    if (this.players.some((player) => player.balance < request.bet)) {
      throw new Error("Some users doesn't have enough balance");
    }
    this.startGame(request);
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

  public play(
    player: BlackJackPlayer,
    action: BlackjackActionRequest,
  ): boolean {
    if (player.roundPlayed) {
      return false;
    }
    switch (action.action) {
      case BlackJackAction.HIT:
        this.hit(player);
        break;
      case BlackJackAction.STAND:
        this.stand(player);
        break;
      case BlackJackAction.DOUBLE_DOWN:
        this.doubleDown(player);
        break;
      case BlackJackAction.SPLIT:
        this.split(player);
        break;
      default:
    }
    return player.isStanding;
  }

  private hit(player: BlackJackPlayer) {
    player.hand[player.currentHandId].push(this.drawCard(this.deck));
    if (this.calculateHandValue(player.hand[player.currentHandId]) >= 21) {
      this.stand(player);
    }
  }

  private stand(player: BlackJackPlayer) {
    player.currentHandId += 1;
    if (player.currentHandId == player.hand.length) {
      player.isStanding = true;
      player.currentHandId = 0;
    }
  }

  private doubleDown(player: BlackJackPlayer) {
    player.bet += player.bet;
    this.hit(player);
    this.stand(player);
  }

  private split(player: BlackJackPlayer) {
    player.bet += player.bet;
    const card: Card = player.hand[player.currentHandId].pop();
    player.currentHandId += 1;
    player.hand.push([card]);
  }

  public toResponse(): BlackjackResponse {
    const players: BlackjackPlayerResponse[] = this._players.map((player) => ({
      playerId: player.id,
      avatar: player.avatar,
      hand: player.hand,
      currentHandId: player.currentHandId,
      balance: player.balance,
      bet: player.bet,
      roundPlayed: player.roundPlayed,
      isStanding: player.isStanding,
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

  public endRound(): GameEndResponse {
    const playerResponse = this.players.map((player) => {
      let totalWin = 0;
      const eachBet = player.bet / player.hand.length;

      while (this.calculateHandValue(this.dealerHand) < 17) {
        this.dealerHand.push(this.drawCard(this.deck));
      }
      const dealerHandValue = this.calculateHandValue(this.dealerHand);

      player.hand.forEach((hand) => {
        const currentHandValue = this.calculateHandValue(hand);
        if (currentHandValue > 21) {
          totalWin += 0;
        } else if (currentHandValue == dealerHandValue) {
          totalWin += eachBet;
        } else if (currentHandValue > dealerHandValue || dealerHandValue > 21) {
          totalWin += eachBet * 2;
        }
      });
      player.balance += totalWin;
      return { player: player, points: totalWin };
    });
    return { end: true, points: playerResponse } as GameEndResponse;
  }
}
