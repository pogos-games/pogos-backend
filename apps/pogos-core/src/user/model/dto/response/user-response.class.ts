import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Avatar } from '../../../../../../../libs/tools/src/game/enum/avatar.enum';

export class UserResponse {
  @ApiProperty()
  @AutoMap()
  id: string;

  @ApiProperty()
  @AutoMap()
  username: string;

  @ApiProperty({enum:Avatar})
  @AutoMap(() => String)
  avatar:Avatar

  @ApiProperty()
  @AutoMap()
  points: number;
}