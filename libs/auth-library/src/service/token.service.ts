import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {

  private readonly jwtAccessTokenExpiration:string = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION');
  private readonly jwtAccessTokenSecret:string = this.configService.get<string>('JWT_SECRET');

  private readonly jwtRefreshTokenExpiration:string = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION');
  private readonly jwtRefreshTokenSecret:string = this.configService.get<string>('JWT_REFRESH_SECRET');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(payload: any): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.jwtAccessTokenExpiration,
      secret: this.jwtAccessTokenSecret
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.jwtRefreshTokenExpiration,
      secret: this.jwtRefreshTokenSecret
    });
    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.jwtRefreshTokenSecret,
      });
    } catch (err) {
      throw new BadRequestException('Invalid refresh token');
    }
  }
}