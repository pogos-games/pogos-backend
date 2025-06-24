import { GameStartRequest } from '../../../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { UnoCard } from '../../../uno/entities/uno-card.interface';

export class UnoStartRequest extends GameStartRequest{
  deck?: UnoCard[]
}