import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Page } from '../../../../../libs/commons-core-library/src/dto/response/page/page.interface';
import { UserResponse } from '../model/dto/response/user-response.class';
import { PageOptions } from '../../../../../libs/commons-core-library/src/dto/response/page/page-options.interface';
import { UserService } from '../service/user.service';

@Controller('ranking')
export class RankingController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get ranked users by points' })
  @ApiResponse({
    status: 200,
    type: Page<UserResponse>,
    description: 'Users ranked by points',
  })
  @Get('/users')
  async getUsersByRanking(
    @Query() pageOptions: PageOptions,
  ): Promise<Page<UserResponse>> {
    return this.userService.getUsersByRanking(pageOptions);
  }
}
