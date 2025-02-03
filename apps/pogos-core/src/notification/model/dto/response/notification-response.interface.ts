import { NotificationType } from '../../enum/notification-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../../../../user/model/dto/response/user-response.class';
import { AutoMap } from '@automapper/classes';

export class NotificationResponse {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty()
  message: string;

  @AutoMap(() => String)
  @ApiProperty()
  type: NotificationType;

  @AutoMap()
  @ApiProperty()
  requestId: string;

  @AutoMap()
  @ApiProperty()
  sender: UserResponse;
}