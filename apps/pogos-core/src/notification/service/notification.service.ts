import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '../model/entity/notification.entity';
import { In, Repository } from 'typeorm';
import { Mapper } from '@automapper/core';
import { NotificationResponse } from '../model/dto/response/notification-response.interface';
import { InjectMapper } from '@automapper/nestjs';
import { NotificationType } from '../model/enum/notification-type.enum';
import { User } from '../../user/model/entity/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectMapper()
    private readonly mapper: Mapper,
  ) {}

  async deleteNotificationByRequestIdAndType(
    requestId: string,
    type: NotificationType,
  ) {
    await this.notificationRepository.delete({
      requestId,
      type,
    });
  }

  async findNotificationsByUserId(
    requestedId: string,
  ): Promise<NotificationResponse[]> {
    const notifications: Notification[] =
      await this.notificationRepository.findBy({ recipient: { id: requestedId }});
    return this.mapper.mapArray(
      notifications,
      Notification,
      NotificationResponse,
    );
  }

  async deleteNotificationById(notificationId: string, recipientId: string) {
    await this.notificationRepository.delete({
      id: notificationId,
      recipient: { id: recipientId }
    });
  }

  async createNotification(
    requestedId: string,
    senderId: string,
    message: string,
    type: NotificationType,
  ): Promise<Notification> {

    const recipient = new User();
    recipient.id = requestedId;
    const notification = new Notification();
    notification.recipient = recipient;
    notification.senderId = senderId;
    notification.message = message;
    notification.type = type;
    return await this.notificationRepository.save(notification);
  }

  async deleteNotifications(
    recipientId: string,
    notificationIds: string[],
  ): Promise<void> {
    await this.notificationRepository.delete({
      recipient: {id:recipientId},
      id: In(notificationIds),
    });
  }
}
