import { BlackJackAction } from '../../enum/black-jack-action.enum';

export interface BlackjackActionRequest {
  action: BlackJackAction,
  gameId: string,
}