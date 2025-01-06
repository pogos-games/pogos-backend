import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './model/entity/user.entity';

@Module({
  imports: [
  TypeOrmModule.forRoot({
    type: 'mysql', // or your database type
    host: 'localhost',
    port: 3306,
    username: 'pogos',
    password: 'pogos',
    database: 'pogos',
    entities: [User],
    synchronize: true,
  }),
  TypeOrmModule.forFeature([User]),
  ],
  providers: [UserService],
  exports: [UserService,TypeOrmModule],
})
export class UserModule {}

