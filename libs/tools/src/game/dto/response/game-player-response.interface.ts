import { Card } from "apps/pogos-games/src/cards/model/card.interface";

export interface GamePlayerResponse {
  playerId:string,
  hand:Card[];
}