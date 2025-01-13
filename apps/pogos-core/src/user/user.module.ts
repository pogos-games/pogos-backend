import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from '@app/database';
import { UserController } from './user.controller';
import { AutomapperModule } from '@automapper/nestjs';
import { UserProfile } from './profile/user.profile';
import { classes } from '@automapper/classes';

@Module({
  imports: [
    DatabaseModule,
    AutomapperModule.forRoot({
      strategyInitializer: classes()
    }),
  ],
  providers: [UserService, UserProfile],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}

