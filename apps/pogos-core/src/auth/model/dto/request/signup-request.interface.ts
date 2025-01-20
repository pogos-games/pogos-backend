import { IsEmail, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupRequest {

  @ApiProperty({
    example:"username",
    required:true
  })
  @MinLength(3)
  @MaxLength(15)
  username: string;

  @ApiProperty({
    example:"test@pogos.com",
    required:true
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example:"test@pogos.com",
    required:true
  })
  @MinLength(6)
  password: string;

}