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
import { GameType } from '../enum/game-type.enum';
import { UnoGameMode } from '../../../../../pogos-games/src/uno/model/uno-game-mode.interface';

@Entity()
export class GameHistory {
  @AutoMap()
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => User, (user) => user.gamesAsPlayer1, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player1Id' })
  player1: User;

  @ManyToOne(() => User, (user) => user.gamesAsPlayer2, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'player2Id' })
  player2?: User;

  @ManyToOne(() => User, (user) => user.gamesAsPlayer3, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'player3Id' })
  player3?: User;

  @ManyToOne(() => User, (user) => user.gamesAsPlayer4, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'player4Id' })
  player4?: User;

  @AutoMap(() => String)
  @Column({
    type: 'enum',
    enum: UnoGameMode,
  })
  gameMode: UnoGameMode;

  @AutoMap(() => String)
  @Column({
    type: 'enum',
    enum: GameType,
  })
  gameType: GameType;

  @CreateDateColumn()
  date: Date;
}