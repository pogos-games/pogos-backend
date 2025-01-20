import { GameResponse } from 'libs/tools/src/game/dto/response/game-response.interface';
import { Card } from '../../../cards/model/card.interface';
import { BlackjackPlayerResponse } from './blackjack-player-response.interface';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';

export interface BlackjackResponse extends GameResponse {
  gameId:string,
  dealerHand: Card[],
  players:BlackjackPlayerResponse[],
  status:GameStatus,
}