import { SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export class ChatGateway  {


  @WebSocketServer()
  server: Server;


  @SubscribeMessage('CHAT')
  async handleChat(client: Socket, payload: string) {
    console.log("Chat sender id:", client.id);
    console.log('Chat message:', payload);
    client.emit('chat', payload);
  }
}
