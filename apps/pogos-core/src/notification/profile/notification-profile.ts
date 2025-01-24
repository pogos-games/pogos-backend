import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Notification } from '../model/entity/notification.entity';
import { NotificationResponse } from '../model/dto/response/notification-response.interface';
import { User } from '../../user/model/entity/user.entity';
import { UserResponse } from '../../user/model/dto/response/user-response.class';

@Injectable()
export class NotificationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        Notification,
        NotificationResponse,
        forMember(
          (dest: NotificationResponse) => dest.sender,
          mapFrom((src: Notification ) => mapper.map(src.sender,User,UserResponse))
        )
      );
    };
  }
}
