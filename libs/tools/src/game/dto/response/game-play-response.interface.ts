import { GamePlayerResponse } from './game-player-response.interface';
import { Game, Player } from '../../entities/game.entity';
import { GameResponse } from './game-response.interface';

export interface GamePlayResponse{
  players: string[],
  end: boolean,
  response: GamePlayerResponse,
  game: Game<GameResponse, Player, GamePlayerResponse>
}