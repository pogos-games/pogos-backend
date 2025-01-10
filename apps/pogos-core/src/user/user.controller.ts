import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {

  constructor(private readonly userService:UserService) {
  }

  @Get("/:userId")
  async findOneById(@Query("userId") userId:string) {
    return this.userService.findOne(userId);
  }

}
