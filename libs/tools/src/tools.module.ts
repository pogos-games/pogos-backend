import { Module } from '@nestjs/common';
import { IdGeneratorService } from './id-generator.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports:[RedisModule],
  providers: [IdGeneratorService],
  exports: [IdGeneratorService,RedisModule],
})
export class ToolsModule {}
