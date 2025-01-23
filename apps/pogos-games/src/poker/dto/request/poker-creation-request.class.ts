import { GameCreationRequest } from 'libs/tools/src/game/dto/request/game-creation-request.class';
import { PokerType } from '../../enum/poker-type.enum';
import { IsNotEmpty } from 'class-validator';

export class PokerCreationRequest extends GameCreationRequest {

@IsNotEmpty()
  type: PokerType
}