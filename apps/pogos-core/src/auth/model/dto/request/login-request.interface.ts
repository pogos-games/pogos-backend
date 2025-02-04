import { IsEmail, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {

  @ApiProperty({
    example:"test@gmail.com",
    required:true
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    required:true
  })
  @MinLength(6)
  @MaxLength(20)
  password: string;
}