import { Expose, Type } from 'class-transformer';
import { GameStatus } from '../enum/game-status.enum';
import { Card } from 'apps/pogos-games/src/cards/model/card.interface';

export abstract class Player {
    id: string;
    username: string;
    hand: Card[];
}

export abstract class Game {
    
    @Expose()
    protected readonly _id: string;

    @Expose()
    @Type(() => Card)
    protected readonly _deck: Card[];

    @Expose()
    protected readonly _leaderId: string;

    @Expose()
    @Type(() => Player)
    protected readonly _players: Player[];
    
    @Expose()
    protected _status: GameStatus;

    constructor(id:string,deck: Card[], leaderId: string) {
    this._id = id;
    this._status = GameStatus.WAITING;
    this._deck = deck;
    this._players = [];
    this._leaderId = leaderId;
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
    
    public get players(): Player[] {
        return this._players;
    }
    
    public get deck(): Card[] {
        return this._deck;
    }
    
    public get leaderId(): string {
        return this._leaderId;
    }

    public addUser(userId: string) {
        if (this.status !== GameStatus.WAITING) {
          throw new Error('Cannot add user to a game that has already started');
        }
        this._players.push({
          id: userId,
          username: 'not defined',
          hand: [],
        });
    }
    
    public drawCard(deck: Card[]): Card {
        return deck.pop();
    }

    public startGame() {
        this._status = GameStatus.IN_PROGRESS;
        this.clearHands();
    }
    
    public clearHands() {
        this._players.forEach((player) => {
          player.hand = [];
        });
    }
    
    public abstract play(player: Player, action: string);
}