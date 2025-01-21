import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { User } from '../../../../apps/pogos-core/src/user/model/entity/user.entity';
import { UserResponse } from '../../../../apps/pogos-core/src/user/model/dto/response/user-response.class';
import { SelfUserResponse } from '../../../../apps/pogos-core/src/user/model/dto/response/self-user-response.class';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';

@Injectable()
export class UserProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      // Mapping User -> UserResponse
      createMap(mapper, User, UserResponse);
      // Mapping User -> SelfUserResponse
      createMap(mapper, User, SelfUserResponse,forMember(
        (destination : SelfUserResponse) => destination.nbNotifications,
        mapFrom((source : User) => source.receivedNotifications.length)
      ));
    };
  }
}

