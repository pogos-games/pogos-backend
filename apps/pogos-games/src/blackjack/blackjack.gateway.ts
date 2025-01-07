import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BlackjackService } from './blackjack.service';
import { ChatGateway } from '../chat/chat.gateway';
import { BlackjackActionRequest } from './dto/request/blackjack-action-request.interface';
import { BlackjackPlayerResponse } from './dto/response/blackjack-player-response.interface';
import { GatewayEventsListener } from './enum/gateway/gateway-events-listener.enum';
import { GatewayEventEmitter } from './enum/gateway/gateway-event-emitter.enum';
import { BlackjackCreationRequest } from './dto/request/blackjack-creation-request.class';
import { BlackjackType } from './enum/blackjack-type.enum';

// process.env.FRONTEND_URL
@WebSocketGateway({ namespace: 'blackjack', cors: 'http://localhost:4200' })
export class BlackjackGateway
  extends ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly blackjackService: BlackjackService) {
    super();
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  private async sendBlackjackAction(
    players: string[],
    blackjackAction: BlackjackPlayerResponse,
  ) {
    players.forEach((playerId) => {
      this.server
        .to(playerId)
        .emit(GatewayEventEmitter.PLAYER_UPDATE, blackjackAction);
    });
  }

  @SubscribeMessage(GatewayEventsListener.END_GAME)
  async handleEndGame(client: Socket, gameId: string) {
    const gameClients = await this.blackjackService.endGame(client, gameId);
    gameClients.forEach((clientId) => {
      this.server
        .to(clientId)
        .emit(GatewayEventEmitter.GAME_UPDATE, 'game ended');
      this.server.sockets.sockets.get(clientId).disconnect();
    });
  }

  @SubscribeMessage(GatewayEventsListener.CREATE_GAME)
  async handleCreateGame(client: Socket, request: BlackjackCreationRequest) {
    const gameId = await this.blackjackService.createGame(
      client.id,
      request.type,
    );
    console.log('Game created:', gameId);
    if (request.type == BlackjackType.SOLO) {
      const response = await this.blackjackService.startGame(client.id, gameId);
      client.emit(GatewayEventEmitter.GAME_UPDATE, response);
    } else {
      client.emit(GatewayEventEmitter.GAME_UPDATE, gameId);
    }
  }

  @SubscribeMessage(GatewayEventsListener.JOIN_GAME)
  async handleJoinGame(client: Socket, gameId: string) {
    await this.blackjackService.joinGame(gameId, client.id);
    client.emit(GatewayEventEmitter.GAME_UPDATE, gameId);
  }

  @SubscribeMessage(GatewayEventsListener.ACTION)
  async handleHit(client: Socket, blackjackAction: BlackjackActionRequest) {
    const { players, response } = await this.blackjackService.play(
      client,
      blackjackAction,
    );
    await this.sendBlackjackAction(players, response);
  }
}
