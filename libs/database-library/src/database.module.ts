import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../../apps/pogos-core/src/user/model/entity/user.entity';
import { Friendship } from '../../../apps/pogos-core/src/friendship/model/entity/friendship.entity';
import { Notification } from '../../../apps/pogos-core/src/notification/model/entity/notification.entity';
import { GameHistory } from '../../../apps/pogos-core/src/history/model/entity/game-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Friendship, Notification, GameHistory],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    //TypeOrmModule.forFeature([User, Friendship]),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}