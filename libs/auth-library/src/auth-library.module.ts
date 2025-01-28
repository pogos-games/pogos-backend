import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from './service/token.service';
import { AuthMiddleware } from '@app/auth-library/auth-ws.middleware';

@Module({
  imports: [PassportModule],
  providers: [JwtService, JwtStrategy, TokenService, AuthMiddleware],
  exports: [JwtService, JwtStrategy, TokenService,AuthMiddleware],
})
export class AuthLibraryModule {}
