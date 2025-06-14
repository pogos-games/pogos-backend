import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { User } from '../../../user/model/entity/user.entity';
import { GameType } from '../../../../../../libs/tools/src/game/enum/game-type.enum';
import { GameMode } from '../../../../../../libs/tools/src/game/enum/game-mode.enum';

@Entity()
export class GameHistory {
  @AutoMap()
  @PrimaryColumn()
  id: string;

  @AutoMap(() => User)
  @ManyToOne(() => User, (user) => user.gamesAsPlayer1, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player1Id' })
  player1: User;

  @Column({ nullable: true })
  player1Name?: string;

  @AutoMap(() => User)
  @ManyToOne(() => User, (user) => user.gamesAsPlayer2, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'player2Id' })
  player2?: User;

  @Column({ nullable: true })
  player2Name?: string;

  @AutoMap(() => User)
  @ManyToOne(() => User, (user) => user.gamesAsPlayer3, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'player3Id' })
  player3?: User;

  @Column({ nullable: true })
  player3Name?: string;

  @AutoMap(() => User)
  @ManyToOne(() => User, (user) => user.gamesAsPlayer4, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'player4Id' })
  player4?: User;

  @Column({ nullable: true })
  player4Name?: string;

  @AutoMap(() => String)
  @Column({
    type: 'enum',
    enum: GameMode,
  })
  mode: GameMode;

  @AutoMap(() => String)
  @Column({
    type: 'enum',
    enum: GameType,
  })
  type: GameType;

  @AutoMap()
  @CreateDateColumn()
  date: Date;
}