import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from '@app/auth-library/jwt/jwt-auth.guard';
import { Principal } from '../user/model/dto/principal.interface';
import { GetPrincipal } from './authentication-principal.decorator';

@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendShipService: FriendshipService) {}

  @Post('send/:userId')
  async sendFriendRequest(
    @Param('userId') userId: string,
    @GetPrincipal() principal: Principal,
  ) {
    console.log('request user id', principal.userId);
    console.log('request user email', principal.email);

    //return this.friendShipService.sendFriendRequest(request.user.id)
    //return this.friendshipService.sendFriendRequest(body.requesterId, body.friendId);
  }

  // @Post('accept')
  // async acceptFriendRequest(@Body() body: { requesterId: number; friendId: number }) {
  //   return this.friendshipService.acceptFriendRequest(body.requesterId, body.friendId);
  // }
  //

  // @Get(':userId')
  // async findFriends(@Param('userId') userId: number) {
  //   return this.friendshipService.findFriends(userId);
  // }
}
