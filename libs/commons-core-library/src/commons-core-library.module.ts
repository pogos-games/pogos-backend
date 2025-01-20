import { Module } from '@nestjs/common';
import { RestLibraryService } from './rest-library.service';

@Module({
  providers: [RestLibraryService],
  exports: [RestLibraryService],
})
export class CommonsCoreLibraryModule {}
