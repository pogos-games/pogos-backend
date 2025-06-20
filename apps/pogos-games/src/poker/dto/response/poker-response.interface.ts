import { GameResponse } from 'libs/tools/src/game/dto/response/game-response.interface';
import { Card } from '../../../cards/model/card.interface';

export interface PokerResponse extends GameResponse {
  dealerHand: Card[],
  pot: number,
  lastBet: number,
  nextPlayerId: string,
}