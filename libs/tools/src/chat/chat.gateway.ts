import { SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';

export class ChatGateway  {

  @SubscribeMessage('CHAT')
  async handleChat(client: Socket, payload: string) {
    console.log("Chat sender id:", client.id);
    console.log('Chat message:', payload);
    client.emit('chat', payload);
  }
}
