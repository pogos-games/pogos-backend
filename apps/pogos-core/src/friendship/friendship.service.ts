import { Injectable } from '@nestjs/common';
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
      friendId,
      status: FriendshipStatus.PENDING,
    });

    return this.friendshipRepository.save(friendship);
  }

  async acceptFriendRequest(
    requesterId: string,
    friendId: string,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId, friendId },
        { requesterId: friendId, friendId: requesterId },
      ],
    });

    if (friendship) {
      friendship.status = FriendshipStatus.ACCEPTED;
      return this.friendshipRepository.save(friendship);
    }

    throw new Error('Friendship request not found');
  }

  async findFriends(userId: string): Promise<User[]> {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { friendId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });

    const friendIds = friendships.map((friendship) =>
      friendship.requesterId === userId
        ? friendship.friendId
        : friendship.requesterId,
    );

    return this.userRepository.find({
      where: {
        id: In(friendIds),
      },
    });
  }
}