import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { Avatar } from '../../enum/avatar.enum';

export class SelfUserResponse {
  @ApiProperty()
  @AutoMap()
  id:string;

  @ApiProperty()
  @AutoMap()
  username:string;

  @ApiProperty()
  @AutoMap(() => String)
  avatar:Avatar;

  @ApiProperty()
  nbNotifications:number

}