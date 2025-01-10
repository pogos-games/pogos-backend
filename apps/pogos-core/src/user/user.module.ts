import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from '@app/database';
import { UserController } from './user.controller';
import { AutomapperModule } from '@automapper/nestjs';

@Module({
  imports: [DatabaseModule, AutomapperModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}

