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

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' }) // recipientId as foreign key
  recipient: User;

  @AutoMap()
  @Column({ nullable: true })
  senderId: string;

  @AutoMap()
  @Column()
  message: string;

  @AutoMap()
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
