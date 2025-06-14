import { AutoMap } from '@automapper/classes';
import { UserResponse } from '../../../../user/model/dto/response/user-response.class';
import { GameMode } from '../../../../../../../libs/tools/src/game/enum/game-mode.enum';
import { GameType } from '../../../../../../../libs/tools/src/game/enum/game-type.enum';

export class GameHistoryDto {
  @AutoMap()
  id: string;

  @AutoMap(() => String)
  mode: GameMode;

  @AutoMap(() => UserResponse)
  player1: UserResponse;

  @AutoMap(() => UserResponse)
  player2?: UserResponse;

  @AutoMap(() => UserResponse)
  player3?: UserResponse;

  @AutoMap(() => UserResponse)
  player4?: UserResponse;

  @AutoMap(() => String)
  type: GameType;

  @AutoMap()
  date: Date;
}
