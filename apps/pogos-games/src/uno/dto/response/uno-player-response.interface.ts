import { GamePlayerResponse } from 'libs/tools/src/game/dto/response/game-player-response.interface';
import { UnoCard } from '../../entities/uno-card.interface';

export interface UnoPlayerResponse extends GamePlayerResponse{
  hand:UnoCard[];
  declaredUno: boolean;
}