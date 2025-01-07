import { ApiProperty } from '@nestjs/swagger';

export class AuthResponse {
  @ApiProperty()
  message: string;
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}