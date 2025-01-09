import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { AuthLibraryModule } from '@app/auth-library';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthLibraryModule,UserModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}