import { ApiProperty } from '@nestjs/swagger';
import { Avatar } from '../../enum/avatar.enum';
import { IsEnum, MaxLength, MinLength } from 'class-validator';

export class UserRequest {
  @ApiProperty()
  @MinLength(3)
  @MaxLength(15)
  username: string;

  @ApiProperty({enum:Avatar})
  @IsEnum(Avatar)
  avatar: Avatar;
}