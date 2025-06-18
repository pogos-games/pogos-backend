import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { SignupRequest } from '../model/dto/request/signup-request.interface';
import { LoginRequest } from '../model/dto/request/login-request.interface';
import { AuthResponse } from '../model/dto/client/response/auth-response.interface';
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PasswordUpdateRequest } from '../model/dto/request/password-update-request.interface';
import { JwtAuthGuard } from '@app/auth-library/jwt/jwt-auth.guard';
import { AuthenticationPrincipal } from '@app/auth-library/authentication-principal.decorator';
import { Principal } from '../../user/model/dto/principal.interface';

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
  @ApiBearerAuth()
  @Post('password')
  async updatePassword(
    @AuthenticationPrincipal() principal: Principal,
    @Body() passwordUpdateRequest: PasswordUpdateRequest,
  ) {
    return this.authService.updatePassword(
      principal.userId,
      passwordUpdateRequest,
    );
  }
}