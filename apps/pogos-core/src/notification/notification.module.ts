import { Module } from '@nestjs/common';
import { NotificationService } from './service/notification.service';
import { NotificationController } from './controller/notification.controller';
import { DatabaseModule } from '@app/database';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './model/entity/notification.entity';
import { NotificationGateway } from './gateway/notification.gateway';
import { NotificationProfile } from './profile/notification-profile';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Notification]),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
  ],
  providers: [NotificationService, NotificationGateway,NotificationProfile],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
