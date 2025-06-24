import { UnoCard } from './uno-card.interface';
import { Player } from 'libs/tools/src/game/entities/game.entity';

export interface UnoPlayer extends Player{
  type: UnoPlayerType;
  hand: UnoCard[];
  declaredUno: boolean;
}

// enums/player-type.enum.ts
export enum UnoPlayerType {
  HUMAN = 'HUMAN',
  BOT = 'BOT',
}
