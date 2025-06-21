import { MessageBody, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatMessage } from './model/chat-message.interface';
import { GatewayEventsListener } from '../game/enum/gateway/gateway-events-listener.enum';

export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage(GatewayEventsListener.CHAT)
  async handleChat(@MessageBody() payload: ChatMessage) {
    console.log('chat received:', payload);
    this.server.to(payload.gameId).emit(GatewayEventsListener.CHAT, payload);
  }
}
