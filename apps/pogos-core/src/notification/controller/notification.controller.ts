import {
  Body,
  Controller,
  Delete, ForbiddenException,
  Get,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@app/auth-library/jwt/jwt-auth.guard';
import { NotificationService } from '../service/notification.service';
import { NotificationResponse } from '../model/dto/response/notification-response.interface';
import { AuthenticationPrincipal } from '@app/auth-library/authentication-principal.decorator';
import { Principal } from '../../user/model/dto/principal.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'find notifications of authenticated user id' })
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: NotificationResponse,
    isArray: true,
    description: 'array of notifications',
  })
  async findNotificationsByUserId(
    @AuthenticationPrincipal() principal: Principal,
    @Param('userId') userId:string
  ): Promise<NotificationResponse[]> {
    if(principal.userId !== userId) {
      throw new ForbiddenException(`Not allowed to read theses notifications`);
    }
    return await this.notificationService.findNotificationsByUserId(
      principal.userId,
    );
  }

  @Delete('/:notificationId')
  @HttpCode(204)
  @ApiParam({
    name: 'notificationId',
    type: String,
    description: 'id of notification to delete',
  })
  async deleteNotificationById(
    @AuthenticationPrincipal() principal: Principal,
    @Param('notificationId') notificationId: string,
  ) {
    await this.notificationService.deleteNotificationById(
      notificationId,
      principal.userId,
    );
  }

  @Delete('/batch')
  @HttpCode(204)
  @ApiBody({
    type: String,
    isArray: true,
    description: 'array of notification id',
  })
  async deleteNotifications(
    @AuthenticationPrincipal() principal: Principal,
    @Body() notificationsIds: string[],
  ) {
    await this.notificationService.deleteNotifications(
      principal.userId,
      notificationsIds,
    );
  }
}
