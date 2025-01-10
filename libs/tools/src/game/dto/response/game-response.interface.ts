import { GamePlayerResponse } from './game-player-response.interface';
import { GameStatus } from '../../enum/game-status.enum';
import { Card } from '../../../../../../apps/pogos-games/src/cards/model/card.interface';

export interface GameResponse {
  gameId:string,
  dealerHand: Card[],
  players:GamePlayerResponse[],
  status:GameStatus,
}