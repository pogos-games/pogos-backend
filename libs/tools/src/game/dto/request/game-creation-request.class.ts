import { GameType } from '../../enum/game-type.enum';
import { IsNotEmpty } from 'class-validator';

export class GameCreationRequest {

@IsNotEmpty()
  type: string
}