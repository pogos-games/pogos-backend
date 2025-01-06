import { Card } from '../../../cards/model/card.interface';

export interface BlackjackPlayerResponse {
  playerId:string,
  hand:Card[],
  balance:number,
  bet:number,
  roundPlayed: boolean;
}