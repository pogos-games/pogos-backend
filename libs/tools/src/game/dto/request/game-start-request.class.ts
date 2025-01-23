import { IsNotEmpty } from 'class-validator';

export class GameStartRequest {

  @IsNotEmpty()
  gameId: string
  @IsNotEmpty()
  type: string
}