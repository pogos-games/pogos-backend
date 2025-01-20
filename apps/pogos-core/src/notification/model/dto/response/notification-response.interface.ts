import { NotificationType } from '../../enum/notification-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  type: NotificationType;

  @ApiProperty()
  requestId: string;

  @ApiProperty()
  senderId: string;
}