import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from '@app/auth-library/jwt/jwt-auth.guard';
import { Principal } from '../user/model/dto/principal.interface';
import { AuthenticationPrincipal } from '@app/auth-library/authentication-principal.decorator';

@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendShipService: FriendshipService) {}

  @Post('send/:userId')
  async sendFriendRequest(
    @Param('userId') userId: string,
    @AuthenticationPrincipal() principal: Principal) {
    return this.friendShipService.sendFriendRequest(principal.userId,userId)
  }

  @Post("accept/:friendRequestId")
  async acceptFriendRequest(@Param("friendRequestId") friendRequestId:string, @AuthenticationPrincipal() principal:Principal) {
    return this.friendShipService.acceptFriendRequest(friendRequestId,principal.userId);
  }

  @Get(':userId')
  async findFriends(@Param('userId') userId: string) {
    return this.friendShipService.findFriends(userId);
  }



}
