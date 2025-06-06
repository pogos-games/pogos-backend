import { createMap, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { GameHistory } from './model/entity/game-history.entity';
import { GameHistoryResponse } from './model/dto/response/game-history-response.interface';
import { User } from '../user/model/entity/user.entity';
import { UserResponse } from '../user/model/dto/response/user-response.class';

@Injectable()
export class GameHistoryProfile {
  constructor(@InjectMapper() private readonly mapper: Mapper) {
    this.configureMapper();
  }

  private configureMapper() {
    createMap(this.mapper, GameHistory, GameHistoryResponse);
    createMap(this.mapper, User, UserResponse);
  }
}
