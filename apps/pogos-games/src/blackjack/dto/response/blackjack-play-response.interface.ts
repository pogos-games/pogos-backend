import { GamePlayResponse } from '../../../../../../libs/tools/src/game/dto/response/game-play-response.interface';
import { Blackjack } from '../../entities/blackjack.entity';
import { BlackjackPlayerResponse } from './blackjack-player-response.interface';

export interface BlackJackPlayResponse extends GamePlayResponse{
  players: string[],
  end: boolean,
  response: BlackjackPlayerResponse,
  game: Blackjack
}