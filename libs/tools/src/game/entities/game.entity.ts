import { Expose, Type } from 'class-transformer';
import { GameStatus } from '../enum/game-status.enum';
import { BaseCard } from 'apps/pogos-games/src/cards/model/card.interface';
import { GameResponse } from '../dto/response/game-response.interface';
import { GamePlayerResponse } from '../dto/response/game-player-response.interface';
import { GameActionRequest } from '../dto/request/game-action-request.interface';
import { randomInt } from 'crypto';
import { GameEndResponse } from '../dto/response/game-end-response.interface';
import { GameStartRequest } from '../dto/request/game-start-request.class';
import { GameMode } from '../enum/game-mode.enum';
import { Avatar } from '../enum/avatar.enum';

export abstract class Player {
  id: string;
  username: string;
  avatar: Avatar;
  hand: any[]
}

export abstract class Game<
  TResponse extends GameResponse,
  TStartRequest extends GameStartRequest,
  TPlayer extends Player,
  TPlayerResponse extends GamePlayerResponse,
  TCard extends BaseCard
> {
  @Expose()
  protected readonly _id: string;

  @Expose()
  @Type(() => BaseCard)
  protected _deck: TCard[];

  @Expose()
  protected readonly _leaderId: string;

  @Expose()
  protected _mode: GameMode;

  @Expose()
  @Type(() => Player)
  _players: TPlayer[] = [];

  @Expose()
  protected _status: GameStatus;

  @Expose()
  protected _private: boolean = false

  constructor(id?: string, deck?: TCard[], leaderId?: string, type?: GameMode) {
    this._id = id ?? '';
    this._status = GameStatus.WAITING;
    this._deck = deck ?? [];
    this._players = [];
    this._leaderId = leaderId ?? '';
    this._mode = type;
  }

  public get id(): string {
    return this._id;
  }

  public get status(): GameStatus {
    return this._status;
  }

  public set status(value: GameStatus) {
    this._status = value;
  }

  public get players(): TPlayer[] {
    return this._players;
  }

  public get deck(): TCard[] {
    return this._deck;
  }

  public get leaderId(): string {
    return this._leaderId;
  }

  public get mode(): GameMode {
    return this._mode;
  }

  public get private(): boolean {
    return this._private;
  }

  public changePrivacy(): void {
    this._private = !this._private
  }

  public addUser(userId: string, avatar: Avatar, playerName: string) {
      if (this.status !== GameStatus.WAITING) {
        throw new Error('Cannot add user to a game that has already started');
      }
      this._players.push({
        id: userId,
        username: playerName,
        avatar: avatar,
      } as TPlayer);
  }

  public removeUser(userId: string): void {
    this._players = this._players.filter((player) => player.id !== userId);
  }

    public checkNoPlayerLeft(): boolean{
      return this.players.length == 0
    }

    public drawCard(deck: TCard[]): TCard {
        return deck.pop();
    }

  public startGame(gameStartRequest: TStartRequest) {
    this._status = GameStatus.IN_PROGRESS;
    this._deck = this.shuffle(this.deck);
    this.clearHands();
  }

  public restartGame(gameStartRequest: TStartRequest) {
    this.startGame(gameStartRequest);
  }

  public clearHands() {}

  abstract play(player: TPlayer, action: GameActionRequest): boolean;

  public abstract toResponse(): TResponse;

  /**
   * renvoie les points de chaque joueurs à la fin de la parite
   */

  public endRound(): GameEndResponse {
    return null;
  }

  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = randomInt(0, i + 1); // Random index from 0 to i
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }
}