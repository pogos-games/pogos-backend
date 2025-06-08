import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, MaxLength, MinLength } from 'class-validator';
import { Avatar } from '../../../../../../../libs/tools/src/game/enum/avatar.enum';

export class UserRequest {
  @ApiProperty()
  @MinLength(3)
  @MaxLength(15)
  username: string;

  @ApiProperty({ enum: Avatar })
  @IsEnum(Avatar)
  avatar: Avatar;
}