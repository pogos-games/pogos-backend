import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DatabaseModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

