import { GamePlayerResponse } from './game-player-response.interface';
import { GameStatus } from '../../enum/game-status.enum';
import { GameMode } from '../../enum/game-mode.enum';

export interface GameResponse {
  gameId:string,
  players:GamePlayerResponse[],
  status:GameStatus,
  mode: GameMode
}