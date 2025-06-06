import { AutoMap } from '@automapper/classes';
import { UserResponse } from '../../../../user/model/dto/response/user-response.class';
import { UnoGameMode } from '../../../../../../pogos-games/src/uno/model/uno-game-mode.interface';
import { GameType } from '../../enum/game-type.enum';

export class GameHistoryResponse {
  @AutoMap()
  id: string;

  @AutoMap(() => UserResponse)
  player1: UserResponse;

  @AutoMap(() => UserResponse)
  player2?: UserResponse;

  @AutoMap(() => UserResponse)
  player3?: UserResponse;

  @AutoMap(() => UserResponse)
  player4?: UserResponse;

  @AutoMap()
  gameMode: UnoGameMode;

  @AutoMap()
  gameType: GameType;

  @AutoMap()
  date: Date;
}
