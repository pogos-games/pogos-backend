import { UnoEndActionType } from '../../enum/uno-end-action-type.enum';

export interface UnoEndAction {
  roomId: string;
  type: UnoEndActionType;
  playerId?: string;
  targetPlayerId?: string;
}