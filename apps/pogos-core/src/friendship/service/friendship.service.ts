import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { User } from '../../user/model/entity/user.entity';
import { Friendship } from '../model/entity/friendship.entity';
import { FriendshipStatus } from '../model/enum/friendship-status.enum';
import { NotificationService } from '../../notification/service/notification.service';
import { NotificationType } from '../../notification/model/enum/notification-type.enum';
import { Principal } from '../../user/model/dto/principal.interface';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async sendFriendRequest(
    requesterId: string,
    friendId: string,
  ): Promise<Friendship> {
    const friend: User = await this.userRepository.findOneBy({ id: friendId });
    if (!friend) {
      throw new NotFoundException(`User ${friendId} not found !`);
    }

    const friendship = this.friendshipRepository.create({
      requesterId,
      requestedId: friendId,
      status: FriendshipStatus.PENDING,
    });

    const friendShip = this.friendshipRepository.save(friendship);
    this.notificationService
      .createNotification(
        friendId,
        requesterId,
        `New Friend Request`,
        NotificationType.FRIENDSHIP_REQUEST,
      )
      .then(() => {
        console.log('friendship notification successfully sent');
      });
    return friendShip;
  }

  async acceptFriendRequest(
    friendshipId: string,
    requestedId: string,
  ): Promise<Friendship> {
    const friendship: Friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException(
        `Friendship request: ${friendshipId} not found !`,
      );
    }

    if (friendship.requestedId !== requestedId) {
      throw new ForbiddenException('Forbidden');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    return this.friendshipRepository
      .save(friendship)
      .then(
        void this.notificationService.deleteNotificationByRequestIdAndType(
          friendship.id,
          NotificationType.FRIENDSHIP_REQUEST,
        ),
      );
  }

  async rejectFriendRequest(friendShipId: string, requestedId: string) {
    void this.friendshipRepository
      .delete({
        id: friendShipId,
        requestedId: requestedId,
      })
      .then(
        void this.notificationService.deleteNotificationByRequestIdAndType(
          friendShipId,
          NotificationType.FRIENDSHIP_REQUEST,
        ),
      );
  }

  async findFriends(userId: string): Promise<User[]> {
    const friendships: Friendship[] = await this.friendshipRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { requestedId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });

    const friendIds: string[] = friendships.map((friendship) =>
      friendship.requesterId === userId
        ? friendship.requestedId
        : friendship.requesterId,
    );

    return this.userRepository.find({
      where: {
        id: In(friendIds),
      },
    });
  }

  async deleteFriendship(principal: Principal, friendshipId: string) {
    await this.friendshipRepository
      .createQueryBuilder()
      .delete()
      .from(Friendship)
      .where("id = :friendshipId", { friendshipId })
      .andWhere(
        new Brackets((qb) => {
          qb.where("requesterId = :userId", { userId: principal.userId })
            .orWhere("requestedId = :userId", { userId: principal.userId });
        })
      )
      .execute();
  }


}