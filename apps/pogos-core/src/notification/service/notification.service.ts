import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '../model/entity/notification.entity';
import { In, Repository } from 'typeorm';
import { Mapper } from '@automapper/core';
import { NotificationResponse } from '../model/dto/response/notification-response.interface';
import { InjectMapper } from '@automapper/nestjs';
import { NotificationType } from '../model/enum/notification-type.enum';
import { User } from '../../user/model/entity/user.entity';
import { NotificationGateway } from '../gateway/notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectMapper()
    private readonly mapper: Mapper,
    private readonly notificationGateway: NotificationGateway,
  ) {}
  async findNotificationsByUserId(
    requestedId: string,
  ): Promise<NotificationResponse[]> {
    const notifications: Notification[] =
      await this.notificationRepository.find({
        where: { recipient: { id: requestedId } },
        relations: ['sender'],
      });

    return this.mapper.mapArray(
      notifications,
      Notification,
      NotificationResponse,
    );
  }

  async deleteNotificationById(notificationId: string, recipientId: string) {
    await this.notificationRepository.delete({
      id: notificationId,
      recipient: { id: recipientId },
    });
  }

  async createNotification(
    recipientId: string,
    senderId: string,
    message: string,
    type: NotificationType,
    requestId: string,
  ): Promise<Notification> {
    const recipient = new User();
    recipient.id = recipientId;

    const sender = new User();
    sender.id = senderId;

    const notification = new Notification();
    notification.recipient = recipient;
    notification.sender = sender;
    notification.message = message;
    notification.type = type;
    notification.requestId = requestId;

    const savedNotification =
      await this.notificationRepository.save(notification);

    const fullNotification = await this.notificationRepository.findOne({
      where: { id: savedNotification.id },
      relations: ['recipient', 'sender'], // ajoute ici d'autres relations si besoin
    });

    if (fullNotification) {
      await this.notificationGateway.sendNotification(
        fullNotification.recipient.id,
        this.mapper.map(fullNotification, Notification, NotificationResponse),
      );
    }

    return fullNotification;
  }

  async deleteNotifications(
    recipientId: string,
    notificationIds: string[],
  ): Promise<void> {
    await this.notificationRepository.delete({
      recipient: { id: recipientId },
      id: In(notificationIds),
    });
  }

  async deleteNotificationByRequestId(requestId: string) {
    await this.notificationRepository.delete({
      requestId,
    });
  }
}
