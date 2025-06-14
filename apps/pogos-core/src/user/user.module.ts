import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { DatabaseModule } from '@app/database';
import { UserController } from './controller/user.controller';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './model/entity/user.entity';
import { CommonsCoreLibraryModule } from '../../../../libs/commons-core-library/src';
import { RankingController } from './ranking/ranking.controller';

@Module({
  imports: [
    DatabaseModule,
    CommonsCoreLibraryModule,
    TypeOrmModule.forFeature([User]),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController, RankingController],
})
export class UserModule {}

