import {
  OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { ChatGateway } from '../chat/chat.gateway';
import { GamePlayerResponse } from './dto/response/game-player-response.interface';
import { GatewayEventsListener } from './enum/gateway/gateway-events-listener.enum';
import { GatewayEventEmitter } from './enum/gateway/gateway-event-emitter.enum';
import { GameCreationRequest } from './dto/request/game-creation-request.class';
import { GameType } from './enum/game-type.enum';
import { Game, Player } from './entities/game.entity';
import { GameResponse } from './dto/response/game-response.interface';

// process.env.FRONTEND_URL
export class GameGateway<
  TResponse extends GameResponse,
  TPlayerResponse extends GamePlayerResponse,
  TPlayer extends Player,
  TGame extends Game<TResponse, TPlayer, TPlayerResponse>,
  TGameService extends GameService<TGame, TResponse, TPlayerResponse, TPlayer>
>
  extends ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(protected readonly gameService: TGameService) {
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

  protected async sendGameAction(
    players: string[],
    gameAction: GamePlayerResponse,
  ) {
    players.forEach((playerId) => {
      this.server
        .to(playerId)
        .emit(GatewayEventEmitter.PLAYER_UPDATE, gameAction);
    });
  }

  @SubscribeMessage(GatewayEventsListener.END_GAME)
  async handleEndGame<TGame>(client: Socket, gameId: string,
                      GameClass: { new(...args: any[]) }) {
    const gameClients = await this.gameService.endGame(client, gameId, GameClass);
    gameClients.forEach((clientId) => {
      this.server
        .to(clientId)
        .emit(GatewayEventEmitter.GAME_UPDATE, 'game ended');
      this.server.sockets.sockets.get(clientId).disconnect();
    });
  }

  @SubscribeMessage(GatewayEventsListener.CREATE_GAME)
  async handleCreateGame(client: Socket, request: GameCreationRequest) {
    const gameId = await this.gameService.createGame(
      client.id,
      request.type,
    );
    console.log('Game created:', gameId);
    if (request.type == GameType.SOLO) {
      const response = await this.gameService.startGame(client.id, gameId);
      client.emit(GatewayEventEmitter.GAME_UPDATE, response);
    } else {
      client.emit(GatewayEventEmitter.GAME_UPDATE, gameId);
    }
  }

  @SubscribeMessage(GatewayEventsListener.JOIN_GAME)
  async handleJoinGame<TGame>(client: Socket, gameId: string,
                       GameClass: { new(...args: any[]) }) {
    await this.gameService.joinGame(gameId, client.id, GameClass);
    client.emit(GatewayEventEmitter.GAME_UPDATE, gameId);
  }
}
