import { UnoCard } from './uno-card.interface';
import { Avatar } from '../../../../../libs/tools/src/game/enum/avatar.enum';

export interface UnoPlayer {
  id: string;
  name: string;
  avatar: Avatar;
  type: UnoPlayerType;
  hand: UnoCard[];
  declaredUno: boolean;
}

// enums/player-type.enum.ts
export enum UnoPlayerType {
  HUMAN = 'HUMAN',
  BOT = 'BOT',
}
