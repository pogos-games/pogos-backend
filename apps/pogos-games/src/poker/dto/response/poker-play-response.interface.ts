import { GamePlayResponse } from '../../../../../../libs/tools/src/game/dto/response/game-play-response.interface';
import { PokerPlayerResponse } from './poker-player-response.interface';
import { Poker } from '../../entities/poker.entity';

export interface PokerPlayResponse extends GamePlayResponse{
  players: string[],
  end: boolean,
  response: PokerPlayerResponse,
  game: Poker
}