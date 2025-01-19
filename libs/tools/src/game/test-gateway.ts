import { SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';

export class TestGateway {
  @SubscribeMessage('TEST')
  async handleTest(client: Socket) {
    console.log('TEST');
  }
}