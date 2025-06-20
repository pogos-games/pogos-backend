import { GamePlayResponse } from '../../../../../../libs/tools/src/game/dto/response/game-play-response.interface';
import { Uno } from '../../entities/uno.entity';
import { UnoPlayerResponse } from './uno-player-response.interface';

export interface UnoPlayResponse extends GamePlayResponse{
  players: string[],
  end: boolean,
  response: UnoPlayerResponse,
  game: Uno
}