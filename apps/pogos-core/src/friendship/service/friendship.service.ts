import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/model/entity/user.entity';
import { Friendship } from '../model/entity/friendship.entity';
import { FriendshipStatus } from '../model/enum/friendship-status.enum';
import { NotificationService } from '../../notification/service/notification.service';
import { NotificationType } from '../../notification/model/enum/notification-type.enum';
import { Principal } from '../../user/model/dto/principal.interface';
import { FriendResponse } from '../model/dto/response/friendship-response.class';
import { FriendshipAction } from '../model/enum/friendship-action.enum';

@Injectable()
export class FriendshipService {
  constructor(
    // repositories
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // services
    private readonly notificationService: NotificationService,
  ) {}

  async sendFriendRequest(
    requesterId: string,
    friendId: string,
  ): Promise<Friendship> {
    const friend: User = await this.userRepository.findOneBy({ id: friendId });
    if (!friend) {
      throw new NotFoundException(`User ${friendId} not found!`);
    }

    const requester: User = await this.userRepository.findOneBy({
      id: requesterId,
    });
    if (!requester) {
      throw new NotFoundException(`User ${requesterId} not found!`);
    }

    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester: requester,
          requested: friend,
          status: FriendshipStatus.PENDING,
        },
        {
          requester: friend,
          requested: requester,
          status: FriendshipStatus.PENDING,
        },
      ],
    });

    if (existingFriendship) {
      throw new ConflictException(
        'Friend request already exists between these users.',
      );
    }

    const friendship = this.friendshipRepository.create({
      requester,
      requested: friend,
      status: FriendshipStatus.PENDING,
    });

    const savedFriendship = await this.friendshipRepository.save(friendship);

    this.notificationService
      .createNotification(
        friendId,
        requesterId,
        `New Friend Request`,
        NotificationType.FRIENDSHIP_REQUEST,
        savedFriendship.id
      )
      .then(() => {
        console.log('Friendship notification successfully sent');
      })
      .catch((error) => {
        console.error('Error sending notification', error);
      });

    return savedFriendship;
  }

  handleFriendRequest(
    principal: Principal,
    friendRequestId: string,
    friendshipAction: FriendshipAction,
  ) {
    switch (friendshipAction) {
      case FriendshipAction.ACCEPT:
        return this.acceptFriendRequest(friendRequestId, principal.userId);
      case FriendshipAction.REJECT:
        return this.rejectFriendRequest(friendRequestId, principal.userId);
      default:
        throw new BadRequestException(`Invalid action: ${friendshipAction}`);
    }
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

    if (friendship.requested.id !== requestedId) {
      throw new ForbiddenException('Forbidden');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    return this.friendshipRepository
      .save(friendship)
      .then(
        void this.notificationService.deleteNotificationByRequestId(
          friendship.id,
        ),
      );
  }

  async rejectFriendRequest(friendShipId: string, friendId: string) {
    await this.friendshipRepository
      .delete({
        id: friendShipId,
        requested: { id: friendId },
      })
      .then(() => {
        this.notificationService.deleteNotificationByRequestId(friendShipId);
      })
      .catch((error) => {
        console.error('Error rejecting friendship request:', error);
      });
  }

  async findFriends(userId: string): Promise<FriendResponse[]> {
    const friendships: Friendship[] = await this.friendshipRepository.find({
      where: [
        {
          requester: { id: userId },
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requested: { id: userId },
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    return friendships.map((friendship) => {
      const friendResponse = new FriendResponse();
      friendResponse.friendshipId = friendship.id;
      friendResponse.user =
        friendship.requester.id === userId
          ? friendship.requested
          : friendship.requester;
      return friendResponse;
    });
  }
}