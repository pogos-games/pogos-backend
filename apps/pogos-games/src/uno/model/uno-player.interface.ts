import { UnoCard } from './uno-card.interface';

export interface UnoPlayer {
  id: string;
  name: string;
  type: UnoPlayerType;
  hand: UnoCard[];
  declaredUno: boolean;
}

// enums/player-type.enum.ts
export enum UnoPlayerType {
  Human = 'HUMAN',
  Bot = 'BOT',
}
