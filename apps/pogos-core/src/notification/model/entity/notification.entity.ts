import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { NotificationType } from '../enum/notification-type.enum';
import { User } from '../../../user/model/entity/user.entity';

@Entity()
export class Notification {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.receivedNotifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' }) // recipientId as foreign key
  recipient: User;

  @ManyToOne(() => User, (user) => user.sentNotifications, { nullable: true, onDelete:'CASCADE' })
  @JoinColumn({ name: 'senderId' }) // senderId as foreign key
  sender: User;

  @AutoMap()
  @Column()
  message: string;

  @AutoMap(() => String)
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @AutoMap()
  @Column({ nullable: true })
  requestId: string;

  @CreateDateColumn()
  date: Date;
}

