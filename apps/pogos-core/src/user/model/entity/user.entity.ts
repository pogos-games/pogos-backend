import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Friendship } from '../../../friendship/model/entity/friendship.entity';
import { AutoMap } from '@automapper/classes';

@Entity()
export class User {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @AutoMap()
  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendRequests: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.friend)
  receivedFriendRequests: Friendship[];
}