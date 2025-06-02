import {
  MessageBody,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatMessage } from './model/chat-message.interface';

export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('CHAT')
  async handleChat(@MessageBody() payload: ChatMessage) {
    console.log('chat received:', payload);
    this.server.to(payload.gameId).emit('CHAT', payload);
  }
}
