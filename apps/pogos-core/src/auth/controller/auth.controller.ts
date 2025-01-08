import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { SignupRequest } from '../model/dto/request/signup-request.interface';
import { LoginRequest } from '../model/dto/request/login-request.interface';
import { AuthResponse } from '../model/dto/client/response/auth-response.interface';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  @Post('login')
  @ApiResponse({
    type: AuthResponse,
    status: 201,
  })
  async signup(@Body() signupRequest: SignupRequest): Promise<AuthResponse> {
    return this.authService.signup(signupRequest);
  }

  @Post('login')
  @HttpCode(200)
  @ApiResponse({
    type: AuthResponse,
    status: 200,
  })
  async login(@Body() loginRequest: LoginRequest): Promise<AuthResponse> {
    return this.authService.login(loginRequest);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'The refresh token',
          example: 'your-refresh-token',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    type: AuthResponse,
    status: 200,
  })
  async refresh(@Body() body: { refreshToken: string }): Promise<AuthResponse> {
    return this.authService.refreshToken(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
      return req.user;
  }
}