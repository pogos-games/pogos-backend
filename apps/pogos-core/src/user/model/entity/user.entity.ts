import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Friendship } from '../../../friendship/model/entity/friendship.entity';
import { AutoMap } from '@automapper/classes';
import { Notification } from '../../../notification/model/entity/notification.entity';
import { Avatar } from '../../../../../../libs/tools/src/game/enum/avatar.enum';
import { GameHistory } from '../../../history/model/entity/game-history.entity';

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

  @OneToMany(() => Friendship, (friendship) => friendship.requested)
  receivedFriendRequests: Friendship[];

  @OneToMany(
    () => Notification,
    (notification: Notification) => notification.recipient,
  )
  receivedNotifications: Notification[];

  @OneToMany(
    () => Notification,
    (notification: Notification) => notification.sender,
  )
  sentNotifications: Notification[];

  @OneToMany(() => GameHistory, (game) => game.player1)
  gamesAsPlayer1: GameHistory[];

  @OneToMany(() => GameHistory, (game) => game.player2)
  gamesAsPlayer2: GameHistory[];

  @OneToMany(() => GameHistory, (game) => game.player3)
  gamesAsPlayer3: GameHistory[];

  @OneToMany(() => GameHistory, (game) => game.player4)
  gamesAsPlayer4: GameHistory[];

  @Column({ default: 0 })
  @AutoMap()
  points: number;

  addPoints(points: number): void {
    this.points += points;
  }
}

