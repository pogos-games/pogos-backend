import { GamePlayerResponse } from 'libs/tools/src/game/dto/response/game-player-response.interface';
import { Card } from '../../../cards/model/card.interface';

export interface BlackjackPlayerResponse extends GamePlayerResponse{
  playerId:string,
  hand:Card[],
  balance:number,
  bet:number,
  roundPlayed: boolean;
}