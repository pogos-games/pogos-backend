import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Friendship } from '../../../friendship/model/entity/friendship.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({unique:true})
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