import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { DatabaseModule } from '@app/database';
import { UserController } from './controller/user.controller';
import { AutomapperModule } from '@automapper/nestjs';
import { UserProfile } from './profile/user.profile';
import { classes } from '@automapper/classes';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './model/entity/user.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
  ],
  providers: [UserService, UserProfile],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}

