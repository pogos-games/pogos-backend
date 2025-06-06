import { Card } from '../../cards/model/card.interface';
import { PokerAction } from '../enum/poker-action.enum';
import { PokerResponse } from '../dto/response/poker-response.interface';
import { PokerPlayerResponse } from '../dto/response/poker-player-response.interface';
import { Expose, Type } from 'class-transformer';
import { Game, Player } from 'libs/tools/src/game/entities/game.entity';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';
import { BadRequestException } from '@nestjs/common';
import { PokerActionRequest } from '../dto/request/poker-action-request.interface';
import * as PokerEvaluator from 'poker-evaluator-ts';
import { GameEndResponse } from '../../../../../libs/tools/src/game/dto/response/game-end-response.interface';
import { GameStartRequest } from '../../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { GameType } from '../../../../../libs/tools/src/game/enum/game-type.enum';

export class PokerPlayer extends Player {
  id: string;
  username: string;
  hand: Card[];
  balance: number;
  roundBet: number
  hasFolded: boolean;
  roundPlayed: boolean;
  allIn: number;
}

export class Poker extends Game<PokerResponse, GameStartRequest, PokerPlayer, PokerPlayerResponse> {
  public SMALL_BLIND = 5;

  @Expose()
  @Type(() => Card)
  private _river: Card[];

  @Expose()
  @Type(() => PokerPlayer)
  protected _players: PokerPlayer[];

  @Expose()
  protected _nextPlayerId: string;

  @Expose()
  private _pot;

  @Expose()
  private _lastBet;

  constructor(
    id?: string,
    deck?: Card[],
    leaderId?: string,
    type?: GameType
  ) {
    super(id,deck,leaderId,type)
    this._river = [];
    this._players = [];
    this._pot = 0;
  }

  public get players(): PokerPlayer[] {
    return this._players;
}

  public get nextPlayerId(){
    return this._nextPlayerId
  }

  public get river() {
    return this._river;
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
      roundBet: 0,
      roundPlayed: false,
      hasFolded: false,
      allIn: 0,
    });
  }

  public startGame(gameStartRequest: GameStartRequest) {
    super.startGame(gameStartRequest);
    this._players = this.shuffle(this._players);

    if (this._players.length > 2) {
      this._nextPlayerId = this._players[2].id;
    }
    else if (this._players.length == 2) {
      this._nextPlayerId = this._players[0].id;
    } else {
      throw new Error("Insufficient players to start the game.");
    }
    const smallBlindPlayer = this._players[0];
    const bigBlindPlayer = this._players[1];

    this.play(smallBlindPlayer, {
      action: PokerAction.RAISE,
      bet: this.SMALL_BLIND,
      gameId: this.id,
    });

    this.play(bigBlindPlayer, {
      action: PokerAction.RAISE,
      bet: this.SMALL_BLIND * 2,
      gameId: this.id,
    });
    this._players.forEach((player) => {
      if (this.deck.length < 2) {
        throw new Error("Not enough cards in the deck to deal.");
      }
      player.hand.push(this.drawCard(this.deck), this.drawCard(this.deck));
    });
  }

  public clearHands() {
    this._river = [];

    this._players.forEach((player) => {
      player.hand = [];
    });
  }

  public play(player: PokerPlayer, action: PokerActionRequest) : boolean {
    if (player.id != this._nextPlayerId){
      throw new Error("You are not allowed to play right now")
    }
    if (player.roundPlayed) {
      throw new Error("Player already played")
    }
    switch (action.action) {
      case PokerAction.BET:
        this.raise(player, action.bet);
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
        this.raise(player, action.bet);
        break;
      default:
        console.log('No more actions available for the moment');
        console.log('Invalid action');
    }
    player.roundPlayed = true;

    const nextPlayer = this._players.find(player => !player.roundPlayed);
    if (nextPlayer) {
      this._nextPlayerId = nextPlayer.id;
    }
    else {
      if (this.river.length == 5){
        return true;
      }
      else if (this.river.length == 0){
        this._river.push(this.drawCard(this.deck))
        this._river.push(this.drawCard(this.deck))
      }
      this._river.push(this.drawCard(this.deck))
      this._nextPlayerId = this._players[0].id
      this._players.forEach(player => {
        player.roundPlayed = false
        this._pot += player.roundBet
      })
    }
    return false;
  }

  private raise(player: PokerPlayer, bet: number){
    if (player.hasFolded) {
      throw new BadRequestException("Vous vous êtes déjà couché");
    }
    if (bet > player.balance){
      throw new BadRequestException("Votre balance est insufisante");
    }
    if (bet == player.balance){
      this.allIn(player)
    }
    if (bet <= 0){
      throw new BadRequestException("Le bet doit être supérieur à 0");
    }
    if ((bet + player.roundBet) < this._lastBet){
      throw new BadRequestException("Le bet doit être supérieur ou égal au last bet");
    }
    player.roundPlayed = true;
    this._lastBet = bet + player.roundBet;
    player.roundBet += bet;
    player.balance -= bet;
    player.allIn += bet;
  }

  private allIn(player: PokerPlayer){
    player.allIn += player.balance;
    player.balance = 0;
    player.roundPlayed = true;
  }

  private call(player: PokerPlayer){
    this.raise(player,this._lastBet - player.roundBet)
  }

  private fold(player: PokerPlayer){
    player.hasFolded = true
    player.roundPlayed = true;
  }

  private check(player: PokerPlayer){
    this._lastBet = 0
    player.roundPlayed = true;
  }

  public endRound(){
    const sortedPlayers = [...this._players].sort((a, b) => {
      return this.evaluateHand(b) - this.evaluateHand(a); // Strongest hand comes first
    });
    this.clearHands()
    sortedPlayers.forEach((player: PokerPlayer) => {
      player.roundBet = 0
      if (this._pot > 0){
        if(player.allIn != 0){
          const maxWin = player.allIn * this._players.length
          if (maxWin < this._pot ) {
            player.balance += maxWin
            this._pot -= maxWin
            player.roundBet = maxWin
          }
        }
        else {
          player.balance += this._pot
          player.roundBet = this._pot
          this._pot = 0
        }
      }
    })
     const gains = sortedPlayers.map((player: PokerPlayer) => ({
       player: player,
       points: player.roundBet,
     }))
    return {end: true, points: gains} as GameEndResponse
  }

  private evaluateHand(player: PokerPlayer): number{
    const combinedHand = [...player.hand, ...this._river].sort((a: Card, b: Card) => {
      return a.value - b.value;
    })
      .map((card: Card) => {
        return card.rank.toUpperCase() + card.suit.toLowerCase()
      });
    return PokerEvaluator.evalHand(combinedHand).value;
  }

  public toResponse(): PokerResponse {
    const players: PokerPlayerResponse[] = this._players.map((player: PokerPlayer) => ({
      playerId: player.id,
      hand: player.hand,
      balance: player.balance,
      roundBet: player.roundBet,
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
      nextPlayerId: this._players[0].id
    } as PokerResponse;
  }
}
