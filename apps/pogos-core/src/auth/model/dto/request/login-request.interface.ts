import { IsEmail, MinLength } from 'class-validator';

export class LoginRequest {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}