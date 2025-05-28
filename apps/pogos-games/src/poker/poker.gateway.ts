import { WebSocketGateway } from '@nestjs/websockets';
import { PokerService } from './poker.service';
import { GameGateway } from '../../../../libs/tools/src/game/game.gateway';
import { Poker, PokerPlayer } from './entities/poker.entity';
import { PokerResponse } from './dto/response/poker-response.interface';
import { PokerPlayerResponse } from './dto/response/poker-player-response.interface';
import { GatewayEventEmitter } from '../../../../libs/tools/src/game/enum/gateway/gateway-event-emitter.enum';
import { PokerPlayResponse } from './dto/response/poker-play-response.interface';
import { GameStartRequest } from '../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { Socket } from 'socket.io';

// process.env.FRONTEND_URL
@WebSocketGateway({ namespace: 'poker', cors: 'http://localhost:4200' })
export class PokerGateway extends GameGateway<PokerResponse, PokerPlayerResponse, GameStartRequest, PokerPlayer, Poker, PokerPlayResponse, PokerService> {
  constructor(private readonly pokerService: PokerService) {
    super(pokerService);
  }

  protected async sendGameAction(pokerGameResponse: PokerPlayResponse) {
    pokerGameResponse.players.forEach((playerId) => {
      this.server
        .to(playerId)
        .emit(GatewayEventEmitter.PLAYER_UPDATE, pokerGameResponse.response);
      this.server
        .to(playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, pokerGameResponse.game.river, pokerGameResponse.game.nextPlayerId);
    });
  }

  async handleDisconnectClientCall(client: Socket) {
    return this.handleDisconnectClient(client, Poker);
  }
}
