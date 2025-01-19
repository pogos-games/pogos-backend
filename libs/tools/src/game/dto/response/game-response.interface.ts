import { GamePlayerResponse } from './game-player-response.interface';
import { GameStatus } from '../../enum/game-status.enum';

export interface GameResponse {
  gameId:string,
  players:GamePlayerResponse[],
  status:GameStatus,
}