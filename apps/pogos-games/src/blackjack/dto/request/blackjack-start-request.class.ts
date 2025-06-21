import { IsNotEmpty } from 'class-validator';
import { GameStartRequest } from '../../../../../../libs/tools/src/game/dto/request/game-start-request.class';

export class BlackjackStartRequest extends GameStartRequest{
  @IsNotEmpty()
  bet: number
}