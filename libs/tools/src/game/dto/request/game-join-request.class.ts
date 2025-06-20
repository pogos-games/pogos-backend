import { IsNotEmpty } from 'class-validator';
import { Avatar } from '../../enum/avatar.enum';

export class GameJoinRequest {

  playerName: string
  avatar: Avatar
  @IsNotEmpty()
  gameId: string
}