import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Friendship } from '../../../friendship/model/entity/friendship.entity';
import { AutoMap } from '@automapper/classes';
import { Avatar } from '../enum/avatar.enum';
import { Notification } from '../../../notification/model/entity/notification.entity';

@Entity()
export class User {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @AutoMap(() => String)
  @Column({
    type: 'enum',
    enum: Avatar,
    default: Avatar.DEFAULT,
  })
  avatar: Avatar;

  @Column()
  password: string;

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendRequests: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.friend)
  receivedFriendRequests: Friendship[];

  @OneToMany(() => Notification, (notification : Notification) => notification.recipient)
  notifications: Notification[];
}
