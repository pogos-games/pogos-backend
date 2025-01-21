import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FriendshipService } from '../service/friendship.service';
import { JwtAuthGuard } from '@app/auth-library/jwt/jwt-auth.guard';
import { Principal } from '../../user/model/dto/principal.interface';
import { AuthenticationPrincipal } from '@app/auth-library/authentication-principal.decorator';
import { FriendshipAction } from '../model/enum/friendship-action.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendShipService: FriendshipService) {}

  @Post('send/:userId')
  @ApiOperation({ summary: 'Send a friend request' })
  @HttpCode(200)
  @ApiParam({
    name: 'userId',
    description: 'user id to request',
  })
  async sendFriendRequest(
    @Param('userId') userId: string,
    @AuthenticationPrincipal() principal: Principal,
  ): Promise<void> {
    await this.friendShipService.sendFriendRequest(principal.userId, userId);
  }

  @Post(':action/:friendRequestId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle a friend request' })
  @ApiParam({
    name: 'action',
    enum: FriendshipAction,
    description: 'The action to perform (ACCEPT or REJECT)',
  })
  @ApiParam({
    name: 'friendRequestId',
    type: String,
    description: 'The ID of the friend request to handle',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request handled successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid action provided.',
  })
  async handleFriendRequest(
    @Param('action') action: FriendshipAction,
    @Param('friendRequestId') friendRequestId: string,
    @AuthenticationPrincipal() principal: Principal,
  ) {
    await this.friendShipService.handleFriendRequest(
      principal,
      friendRequestId,
      action,
    );
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Find friends of given user Id' })
  async findFriends(@Param('userId') userId: string) {
    return this.friendShipService.findFriends(userId);
  }
}
