import { Module } from '@nestjs/common';
import { FriendshipService } from './service/friendship.service';
import { FriendshipController } from './controller/friendship.controller';
import { DatabaseModule } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './model/entity/friendship.entity';
import { UserModule } from '../user/user.module';
import { User } from '../user/model/entity/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { CommonsCoreLibraryModule } from '../../../../libs/commons-core-library/src';

@Module({
  imports: [
    UserModule,
    NotificationModule,
    DatabaseModule,
    TypeOrmModule.forFeature([Friendship,User])],
  providers: [FriendshipService,CommonsCoreLibraryModule],
  controllers: [FriendshipController],
})
export class FriendshipModule {}
