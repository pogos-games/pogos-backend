import { GamePlayerResponse } from 'libs/tools/src/game/dto/response/game-player-response.interface';
import { Card } from '../../../cards/model/card.interface';

export interface PokerPlayerResponse extends GamePlayerResponse{
  playerId:string,
  hand:Card[];
  balance:number,
  roundBet:number,
  roundPlayed: boolean,
  allIn: number,
}