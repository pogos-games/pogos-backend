import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../user/model/entity/user.entity';
import { Friendship } from './model/entity/friendship.entity';
import { FriendshipStatus } from './model/enum/friendship-status.enum';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(
    requesterId: string,
    friendId: string,
  ): Promise<Friendship> {
    const friendship = this.friendshipRepository.create({
      requesterId,
      requestedId: friendId,
      status: FriendshipStatus.PENDING,
    });

    return this.friendshipRepository.save(friendship);
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
    return this.friendshipRepository.save(friendship);
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
}