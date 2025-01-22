import { GameActionRequest } from 'libs/tools/src/game/dto/request/game-action-request.interface';
import { PokerAction } from '../../enum/poker-action.enum';

export interface PokerActionRequest extends GameActionRequest {
  action: PokerAction,
  bet: number,
  gameId: string,
}