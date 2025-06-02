import { UnoCard } from './uno-card.interface';

export enum UnoActionType {
  PLAY_CARD = 'PLAY_CARD',
  DRAW_CARD = 'DRAW_CARD',
}

export interface UnoAction {
  roomId: string;
  type: UnoActionType;
  playerId: string; // Optional, depending on the action
  card?: UnoCard;
}