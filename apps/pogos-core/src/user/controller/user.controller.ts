import { Controller, Get, HttpCode, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { PageOptions } from '../../../../../libs/commons-core-library/src/dto/page/page-options.interface';
import { JwtAuthGuard } from '@app/auth-library/jwt/jwt-auth.guard';
import { UserResponse } from '../model/dto/response/user-response.class';
import { Page } from '../../../../../libs/commons-core-library/src/dto/page/page.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticationPrincipal } from '@app/auth-library/authentication-principal.decorator';
import { Principal } from '../model/dto/principal.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({summary: 'return authenticated user'})
  @ApiBearerAuth()
  @Get('self')
  @HttpCode(200)
  @ApiResponse({
    status:200,
    type: UserResponse
  })
  async findSelfProfile(@AuthenticationPrincipal() principal:Principal) {
    return this.userService.findSelfProfile(principal);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({summary: 'find user by id'})
  @ApiResponse({
    status:200,
    type: UserResponse,
    description: 'dto of user'
  })
  @Get('/:userId')
  async findOneById(@Param('userId') userId: string): Promise<UserResponse> {
    return this.userService.findOne(userId);
  }

  @Get('/username/:username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({summary: 'find a page of users that username contains given string'})
  @ApiResponse({
    status:200,
    type: Page<UserResponse>,
    description: 'dto of user'
  })
  async findByUsername(
    @Param('username') username: string,
    @Query() pageOptions: PageOptions,
  ): Promise<Page<UserResponse>> {
    return this.userService.findByUsernameContaining(username, pageOptions);
  }

  @Get('/exists/:username')
  @ApiOperation({summary: 'check if username is already taken'})
  @HttpCode(200)
  @ApiResponse({
    status:200,
    type:Boolean,
    })
  async existsByUsername(
    @Param('username') username: string,
  ): Promise<boolean> {
    return await this.userService.existsByUsername(username);
  }
}
