import { Module } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
import { DatabaseModule } from '@app/database';

@Module({
  imports:[DatabaseModule],
  providers: [FriendshipService],
  controllers: [FriendshipController],
})
export class FriendshipModule {}
