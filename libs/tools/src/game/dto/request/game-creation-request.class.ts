import { IsNotEmpty } from 'class-validator';

export class GameCreationRequest {

@IsNotEmpty()
  type: string
}