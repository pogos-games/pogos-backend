import { GameResponse } from 'libs/tools/src/game/dto/response/game-response.interface';
import { Card } from '../../../cards/model/card.interface';

export interface BlackjackResponse extends GameResponse {
  dealerHand: Card[],
}