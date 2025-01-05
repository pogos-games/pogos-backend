import { Card } from '../../../cards/model/card.interface';
import { BlackjackPlayerResponse } from './blackjack-player-response.interface';
import { BlackJackStatus } from '../../enum/black-jack-status.enum';

export interface BlackjackResponse {
  gameId:string,
  dealerHand: Card[],
  players:BlackjackPlayerResponse[],
  status:BlackJackStatus,
}