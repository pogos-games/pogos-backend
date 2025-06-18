import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class PasswordUpdateRequest {
  @ApiProperty({
    example: 'oldpassword',
    required: true,
  })
  oldPassword: string;

  @ApiProperty({
    example: 'newPassword',
    required: true,
  })
  @MinLength(6)
  newPassword: string;
}