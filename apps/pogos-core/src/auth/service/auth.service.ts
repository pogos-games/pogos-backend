import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import * as bcrypt from 'bcrypt';
import { LoginRequest } from '../model/dto/request/login-request.interface';
import { TokenService } from './token.service';
import { SignupRequest } from '../model/dto/request/signup-request.interface';
import { AuthResponse } from '../model/dto/client/response/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    const user = await this.usersService.findOneByEmail(loginRequest.email);
    if (!user) {
      throw new NotFoundException('Email not found !');
    }
    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const { accessToken, refreshToken } = this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
    });

    return {
      message: 'User successfully logged in',
      accessToken,
      refreshToken,
    };
  }

  async signup(user: SignupRequest): Promise<AuthResponse> {
    if (await this.usersService.existsByEmail(user.email)) {
      throw new ConflictException('Email already exists');
    }
    user.password = await bcrypt.hash(user.password, 10);

    const savedUser = await this.usersService.create(user);
    const payload = { sub: savedUser.id, email: savedUser.email };
    const { accessToken, refreshToken } =
      this.tokenService.generateTokens(payload);

    return {
      message: 'User successfully registered',
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
    const payload = { sub: decoded.sub, email: decoded.email };
    const { accessToken, refreshToken: newRefreshToken } =
      this.tokenService.generateTokens(payload);

    return {
      message: 'Token refreshed',
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}

