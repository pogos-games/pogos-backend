import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Avatar } from '../../enum/avatar.enum';

export class UserResponse {
  @ApiProperty()
  @AutoMap()
  id: string;

  @ApiProperty()
  @AutoMap()
  username: string;

  @ApiProperty()
  @AutoMap(() => String)
  avatar:Avatar
}