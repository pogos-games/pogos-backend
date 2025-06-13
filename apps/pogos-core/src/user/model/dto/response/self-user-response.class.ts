import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { Avatar } from '../../../../../../../libs/tools/src/game/enum/avatar.enum';

export class SelfUserResponse {
  @ApiProperty()
  @AutoMap()
  id:string;

  @ApiProperty()
  @AutoMap()
  username:string;

  @ApiProperty({enum:Avatar})
  @AutoMap(() => String)
  avatar:Avatar;

  @ApiProperty()
  nbNotifications:number

}