import { Card } from 'apps/pogos-games/src/cards/model/card.interface';
import { GamePlayerResponse } from './game-player-response.interface';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';

export interface GameResponse {
  gameId:string,
  dealerHand: Card[],
  players:GamePlayerResponse[],
  status:GameStatus,
}