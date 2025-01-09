import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from './service/token.service';

@Module({
  imports: [PassportModule],
  providers: [JwtService, JwtStrategy, TokenService],
  exports: [JwtService, JwtStrategy, TokenService],
})
export class AuthLibraryModule {}
