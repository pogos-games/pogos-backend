import { GameResponse } from 'libs/tools/src/game/dto/response/game-response.interface';
import { Card } from '../../../cards/model/card.interface';
import { PokerPlayerResponse } from './poker-player-response.interface';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';

export interface PokerResponse extends GameResponse {
  gameId:string,
  river: Card[],
  players:PokerPlayerResponse[],
  pot: number,
  lastBet: number,
  status:GameStatus,
}