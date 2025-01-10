import { GameCreationRequest } from 'libs/tools/src/game/dto/request/game-creation-request.class';
import { BlackjackType } from '../../enum/blackjack-type.enum';
import { IsNotEmpty } from 'class-validator';

export class BlackjackCreationRequest extends GameCreationRequest {

@IsNotEmpty()
  type: BlackjackType
}