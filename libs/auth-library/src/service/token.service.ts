import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  private jwtSecret = this.configService.get<string>('JWT_SECRET');
  private jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(payload: any) : { accessToken:string, refreshToken: string} {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.jwtSecret,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '45m',
      secret: this.jwtRefreshSecret,
    });
    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.jwtRefreshSecret,
      });
    } catch (err) {
      throw new BadRequestException('Invalid refresh token');
    }
  }
}