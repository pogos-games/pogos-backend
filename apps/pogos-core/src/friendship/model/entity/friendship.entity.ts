import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../user/model/entity/user.entity';
import { FriendshipStatus } from '../enum/friendship-status.enum';

@Entity()
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status: FriendshipStatus;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sentFriendRequests,{eager:true})
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests,{eager:true})
  @JoinColumn({ name: 'requestedId' })
  requested: User;
}