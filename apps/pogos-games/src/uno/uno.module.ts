import { Module } from '@nestjs/common';
import { UnoGateway } from './uno.gateway';

@Module({
  providers: [UnoGateway],
})
export class UnoModule {}
