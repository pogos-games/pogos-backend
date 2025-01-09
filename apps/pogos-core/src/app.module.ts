import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { FriendshipModule } from './friendship/friendship.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    HttpModule,
    UserModule,
    FriendshipModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
