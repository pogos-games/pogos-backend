import { BlackjackType } from '../../enum/blackjack-type.enum';
import { IsNotEmpty } from 'class-validator';

export class BlackjackCreationRequest {

@IsNotEmpty()
  type: BlackjackType
}