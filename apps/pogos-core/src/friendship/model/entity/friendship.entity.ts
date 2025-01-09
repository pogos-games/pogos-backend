import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../../user/model/entity/user.entity';
import { FriendshipStatus } from '../enum/friendship-status.enum';

@Entity()
export class Friendship {
  @PrimaryColumn()
  requesterId: string;

  @PrimaryColumn()
  friendId: string;

  @Column({ type: 'enum', enum: FriendshipStatus, default: FriendshipStatus.PENDING })
  status: FriendshipStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sentFriendRequests)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests)
  @JoinColumn({ name: 'friendId' })
  friend: User;
}