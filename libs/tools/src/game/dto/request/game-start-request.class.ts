import { IsNotEmpty } from 'class-validator';
import { GameMode } from '../../enum/game-mode.enum';

export class GameStartRequest {

  @IsNotEmpty()
  gameId: string
  @IsNotEmpty()
  mode: GameMode
}