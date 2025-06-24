import { GameActionRequest } from 'libs/tools/src/game/dto/request/game-action-request.interface';
import { UnoCard } from '../../entities/uno-card.interface';

export interface UnoActionRequest extends GameActionRequest {
  card?: UnoCard;
}