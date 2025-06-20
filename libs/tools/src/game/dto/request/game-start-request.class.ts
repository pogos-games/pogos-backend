import { IsNotEmpty } from 'class-validator';
import { GameType } from '../../enum/game-type.enum';

export class GameStartRequest {

  @IsNotEmpty()
  gameId: string
  @IsNotEmpty()
  type: GameType
}