import { IsNotEmpty } from 'class-validator';
import { Avatar } from '../../enum/avatar.enum';
import { GameMode } from '../../enum/game-mode.enum';

export class GameCreationRequest {

  playerName: string
  avatar: Avatar
  @IsNotEmpty()
  mode: GameMode;
}