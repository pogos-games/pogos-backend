import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from '@app/database';
import { UserController } from './user.controller';

@Module({
  imports: [DatabaseModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}

