import { GameResponse } from 'libs/tools/src/game/dto/response/game-response.interface';
import { UnoCard } from '../../entities/uno-card.interface';
import { UnoGameDirection } from '../../enum/uno-game-direction.enum';

export interface UnoResponse extends GameResponse {
  deck: UnoCard[],
  discardPile: UnoCard[];
  currentTurnPlayerId: string;
  direction: UnoGameDirection;
  winnerUsername?: string;
}