import {
  OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthenticationPrincipal } from '@app/auth-library/authentication-principal.decorator';
import { Principal } from '../../user/model/dto/principal.interface';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@app/auth-library/jwt/jwt-auth.guard';

@WebSocketGateway({ namespace: 'notifications' })
@UseGuards(JwtAuthGuard)
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  handleConnection(
    client: Socket,
    @AuthenticationPrincipal() principal: Principal,
  ) {
    console.log(`Client connecté : ${client.id}`);
    console.log('user id',principal.userId);
    //console.log(`Client user id :${principal.userId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client déconnecté : ${client.id}`);
  }

  @SubscribeMessage('testMessage')
  handleTestMessage(data: string): void {
    console.log(`Received test message: ${data}`);
    // You can add additional logic here to handle the message
  }


}
