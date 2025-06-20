import { GamePlayerResponse } from 'libs/tools/src/game/dto/response/game-player-response.interface';
import { Card } from '../../../cards/model/card.interface';

export interface PokerPlayerResponse extends GamePlayerResponse{
  hand:Card[];
  balance:number,
  bet:number,
  roundPlayed: boolean,
  allIn: number,
}