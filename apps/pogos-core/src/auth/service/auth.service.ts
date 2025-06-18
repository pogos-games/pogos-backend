import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/service/user.service';
import * as bcrypt from 'bcrypt';
import { LoginRequest } from '../model/dto/request/login-request.interface';
import { TokenService } from '@app/auth-library/service/token.service';
import { SignupRequest } from '../model/dto/request/signup-request.interface';
import { AuthResponse } from '../model/dto/client/response/auth-response.interface';
import { PasswordUpdateRequest } from '../model/dto/request/password-update-request.interface';
import { User } from '../../user/model/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly tokenService: TokenService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      username: user.username,
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
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      username: user.username,
    };
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
    const user = await this.usersService.findOneByEmail(decoded.email);
    const payload = {
      sub: decoded.sub,
      email: decoded.email,
      username: user.username,
    };
    const { accessToken, refreshToken: newRefreshToken } =
      this.tokenService.generateTokens(payload);

    return {
      message: 'Token refreshed',
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async updatePassword(
    userId: string,
    passwordUpdateRequest: PasswordUpdateRequest,
  ) {
    const user: User = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      passwordUpdateRequest.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    user.password = await bcrypt.hash(passwordUpdateRequest.newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
    return { message: 'Account deleted successfully' };
  }
}

