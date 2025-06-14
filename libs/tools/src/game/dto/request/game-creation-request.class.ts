import { IsNotEmpty } from 'class-validator';
import { GameMode } from '../../enum/game-mode.enum';

export class GameCreationRequest {
  @IsNotEmpty()
  type: GameMode;
}