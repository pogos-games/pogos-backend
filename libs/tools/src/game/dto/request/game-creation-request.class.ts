import { IsNotEmpty } from 'class-validator';
import { GameType } from '../../enum/game-type.enum';

export class GameCreationRequest {

  @IsNotEmpty()
  type: GameType
}