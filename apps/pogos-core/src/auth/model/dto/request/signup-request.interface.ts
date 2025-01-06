import { IsEmail, MinLength } from 'class-validator';

export class SignupRequest {

  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

}