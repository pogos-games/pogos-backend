import { WebSocketGateway } from '@nestjs/websockets';
import { PokerService } from './poker.service';
import { GameGateway } from '../../../../libs/tools/src/game/game.gateway';
import { Poker, PokerPlayer } from './entities/poker.entity';
import { PokerResponse } from './dto/response/poker-response.interface';
import { PokerPlayerResponse } from './dto/response/poker-player-response.interface';
import { PokerPlayResponse } from './dto/response/poker-play-response.interface';
import { GameStartRequest } from '../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { Socket } from 'socket.io';
import { Card } from '../cards/model/card.interface';

// process.env.FRONTEND_URL
@WebSocketGateway({ namespace: 'poker', cors: '*' })
export class PokerGateway extends GameGateway<PokerResponse, PokerPlayerResponse, GameStartRequest, PokerPlayer, Poker, PokerPlayResponse, PokerService, Card> {
  constructor(private readonly pokerService: PokerService) {
    super(pokerService);
  }

  async handleDisconnectClientCall(client: Socket) {
    return this.handleDisconnectClient(client, Poker);
  }
}
