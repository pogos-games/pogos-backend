import { Module } from '@nestjs/common';
import { UnoGateway } from './uno.gateway';
import { UnoService } from './uno.service';
import { ToolsModule } from '../../../../libs/tools-library/src';

@Module({
  imports:[ToolsModule],
  providers: [UnoGateway, UnoService],
})
export class UnoModule {}
