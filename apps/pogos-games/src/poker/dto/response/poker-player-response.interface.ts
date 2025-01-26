import { GamePlayerResponse } from 'libs/tools/src/game/dto/response/game-player-response.interface';

export interface PokerPlayerResponse extends GamePlayerResponse{
  playerId:string,
  balance:number,
  roundBet:number,
  roundPlayed: boolean,
  allIn: number,
}