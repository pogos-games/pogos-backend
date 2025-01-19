import {
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BlackjackService } from './blackjack.service';
import { BlackjackActionRequest } from './dto/request/blackjack-action-request.interface';
import { GatewayEventsListener } from '../../../../libs/tools/src/game/enum/gateway/gateway-events-listener.enum';
import { GameGateway } from '../../../../libs/tools/src/game/game.gateway';
import { Blackjack, BlackJackPlayer } from './entities/blackjack.entity';
import { BlackjackResponse } from './dto/response/blackjack-response.interface';
import { BlackjackPlayerResponse } from './dto/response/blackjack-player-response.interface';

// process.env.FRONTEND_URL
@WebSocketGateway({ namespace: 'blackjack', cors: 'http://localhost:4200' })
export class BlackjackGateway extends GameGateway<BlackjackResponse, BlackjackPlayerResponse, BlackJackPlayer, Blackjack, BlackjackService> {
  constructor(private readonly blackjackService: BlackjackService) {
    super(blackjackService);
  }

  @SubscribeMessage(GatewayEventsListener.ACTION)
  async handleHit(client: Socket, blackjackAction: BlackjackActionRequest) {
    const { players, response } = await this.blackjackService.play(
      client,
      blackjackAction,
    );
    await this.sendGameAction(players, response);
  }
}
