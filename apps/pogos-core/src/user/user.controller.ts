import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/:userId')
  async findOneById(@Param('userId') userId: string) {
    return this.userService.findOne(userId);
  }

  @Get('/exists/:username')
  async existsByUsername(
    @Param('username') username: string,
  ): Promise<boolean> {
    return await this.userService.existsByUsername(username);
  }
}
