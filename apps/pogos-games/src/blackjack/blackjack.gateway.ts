import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BlackjackService } from './blackjack.service';
import { GameGateway } from '../../../../libs/tools/src/game/game.gateway';
import { Blackjack, BlackJackPlayer } from './entities/blackjack.entity';
import { BlackjackResponse } from './dto/response/blackjack-response.interface';
import { BlackjackPlayerResponse } from './dto/response/blackjack-player-response.interface';
import { BlackJackPlayResponse } from './dto/response/blackjack-play-response.interface';
import { GatewayEventsListener } from '../../../../libs/tools/src/game/enum/gateway/gateway-events-listener.enum';
import { Socket } from 'socket.io';
import { GatewayEventEmitter } from '../../../../libs/tools/src/game/enum/gateway/gateway-event-emitter.enum';
import { BlackjackActionRequest } from './dto/request/blackjack-action-request.interface';
import { BlackjackStartRequest } from './dto/request/blackjack-start-request.class';

// process.env.FRONTEND_URL
@WebSocketGateway({ namespace: 'blackjack', cors: 'http://localhost:4200' })
export class BlackjackGateway extends GameGateway<BlackjackResponse, BlackjackPlayerResponse, BlackjackStartRequest, BlackJackPlayer, Blackjack, BlackJackPlayResponse, BlackjackService> {
  constructor(private readonly blackjackService: BlackjackService) {
    super(blackjackService);
  }

  @SubscribeMessage(GatewayEventsListener.ACTION)
  async handleAction(client: Socket, gameAction: BlackjackActionRequest) {
    const gamePlayResponse = await this.gameService.play(
      client,
      gameAction,
    );
    if (gamePlayResponse.end){
      gamePlayResponse.game.endRound().points.forEach((player) => {
        this.server
          .to(player.playerId)
          .emit(GatewayEventEmitter.GAME_UPDATE, gamePlayResponse)
        this.server
          .to(player.playerId)
          .emit(GatewayEventEmitter.END_GAME, player.points);
      })
    }
    await this.sendGameAction(gamePlayResponse);
  }
}
