import { Module } from '@nestjs/common';
import { UserProfile } from './profile/user.profile';

@Module({
  providers: [UserProfile],
  exports: [UserProfile],
})
export class CommonsCoreLibraryModule {}
