import { Player } from '../../entities/game.entity';

export interface GameEndResponse {
  end:boolean,
  points:{player: Player, points: number}[];
}