import { GamePlayerResponse } from './game-player-response.interface';
import { Game, Player } from '../../entities/game.entity';
import { GameResponse } from './game-response.interface';
import { GameStartRequest } from '../request/game-start-request.class';
import { BaseCard } from '../../../../../../apps/pogos-games/src/cards/model/card.interface';

export interface GamePlayResponse{
  players: string[],
  end: boolean,
  response: GamePlayerResponse,
  game: Game<GameResponse, GameStartRequest, Player, GamePlayerResponse,BaseCard>,
  currentPlayerId: string
}