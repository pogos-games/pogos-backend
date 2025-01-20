import { GameActionRequest } from 'libs/tools/src/game/dto/request/game-action-request.interface';
import { BlackJackAction } from '../../enum/black-jack-action.enum';

export interface BlackjackActionRequest extends GameActionRequest {
  action: BlackJackAction,
  gameId: string,
}