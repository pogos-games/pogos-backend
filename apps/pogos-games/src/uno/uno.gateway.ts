import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({namespace: 'uno'})
export class UnoGateway {

}
