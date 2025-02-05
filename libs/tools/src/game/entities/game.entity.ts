import { Expose, Type } from 'class-transformer';
import { GameStatus } from '../enum/game-status.enum';
import { Card } from 'apps/pogos-games/src/cards/model/card.interface';
import { GameResponse } from '../dto/response/game-response.interface';
import { GamePlayerResponse } from '../dto/response/game-player-response.interface';
import { GameActionRequest } from '../dto/request/game-action-request.interface';
import { randomInt } from 'crypto';
import { GameEndResponse } from '../dto/response/game-end-response.interface';

export abstract class Player {
    id: string;
    username: string;
}

export abstract class Game<TResponse extends GameResponse,
  TPlayer extends Player,
  TPlayerResponse extends GamePlayerResponse
> {
    
    @Expose()
    protected readonly _id: string;

    @Expose()
    @Type(() => Card)
    protected _deck: Card[];

    @Expose()
    protected readonly _leaderId: string;

    @Expose()
    protected readonly _type: string;

    @Expose()
    @Type(() => Player)
    protected readonly _players: TPlayer[];
    
    @Expose()
    protected _status: GameStatus;

    constructor(
      id?: string,
      deck?: Card[],
      leaderId?: string,
      type?: string
    ) {
        this._id = id ?? '';
        this._status = GameStatus.WAITING;
        this._deck = deck ?? [];
        this._players = [];
        this._leaderId = leaderId ?? '';
        this._type = type ?? '';
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
    
    public get deck(): Card[] {
        return this._deck;
    }
    
    public get leaderId(): string {
        return this._leaderId;
    }

    public get type(): string {
        return this._type;
    }

    public addUser(userId: string) {
        if (this.status !== GameStatus.WAITING) {
          throw new Error('Cannot add user to a game that has already started');
        }
        this._players.push({
          id: userId,
          username: 'not defined',
          hand: [],
        } as TPlayer);
    }
    
    public drawCard(deck: Card[]): Card {
        return deck.pop();
    }

    public startGame() {
        this._status = GameStatus.IN_PROGRESS;
        this._deck = this.shuffle(this.deck);
        this.clearHands();
    }
    
    public abstract clearHands();
    
    play(player: TPlayer, action: GameActionRequest): boolean{
        if (action) {
            console.log('No more actions available for the moment');
            return true
        }
        else{
            console.log('Invalid action');
            return false
        }
    }

    public abstract toResponse() : TResponse;

    /**
     * renvoie les points de chaque joueurs à la fin de la parite
     */
    public abstract endRound(): GameEndResponse;

    public shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = randomInt(0, i + 1); // Random index from 0 to i
            [array[i], array[j]] = [array[j], array[i]];  // Swap elements
        }
        return array;
    }
}