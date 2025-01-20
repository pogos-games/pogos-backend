import { Module } from '@nestjs/common';
import { NotificationService } from './service/notification.service';
import { NotificationController } from './controller/notification.controller';
import { DatabaseModule } from '@app/database';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './model/entity/notification.entity';
import { NotificationGateway } from './gateway/notification.gateway';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Notification]),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
  ],
  providers: [NotificationService, NotificationGateway],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
