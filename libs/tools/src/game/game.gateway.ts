import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { ChatGateway } from '../chat/chat.gateway';
import { GamePlayerResponse } from './dto/response/game-player-response.interface';
import { GatewayEventsListener } from './enum/gateway/gateway-events-listener.enum';
import { GatewayEventEmitter } from './enum/gateway/gateway-event-emitter.enum';
import { GameCreationRequest } from './dto/request/game-creation-request.class';
import { Game, Player } from './entities/game.entity';
import { GameResponse } from './dto/response/game-response.interface';
import { GameActionRequest } from './dto/request/game-action-request.interface';
import { GameStartRequest } from './dto/request/game-start-request.class';
import { GamePlayResponse } from './dto/response/game-play-response.interface';

// process.env.FRONTEND_URL
export class GameGateway<
    TResponse extends GameResponse,
    TPlayerResponse extends GamePlayerResponse,
    TStartRequest extends GameStartRequest,
    TPlayer extends Player,
    TGame extends Game<TResponse, TStartRequest, TPlayer, TPlayerResponse>,
    TPlayResponse extends GamePlayResponse,
    TGameService extends GameService<
      TGame,
      TStartRequest,
      TResponse,
      TPlayerResponse,
      TPlayer,
      TPlayResponse
    >,
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
    console.log('Client connected');
  }

  handleDisconnect(client: Socket) {}

  protected async sendGameAction(gamePlayResponse: GamePlayResponse) {
    gamePlayResponse.players.forEach((playerId) => {
      this.server
        .to(playerId)
        .emit(GatewayEventEmitter.PLAYER_UPDATE, gamePlayResponse.response);
    });
  }

  @SubscribeMessage(GatewayEventsListener.END_GAME)
  async handleEndGame(
    client: Socket,
    gameId: string,
    GameClass: new () => TGame,
  ) {
    const game = await this.gameService.endGame(client, gameId, GameClass);
    game.players.forEach((player) => {
      this.server.to(player.id).emit(GatewayEventEmitter.END_GAME, player);
      this.server
        .to(player.id)
        .emit(GatewayEventEmitter.GAME_UPDATE, 'game ended');
      this.server.sockets.sockets.get(player.id).disconnect();
    });
  }

  @SubscribeMessage(GatewayEventsListener.CREATE_GAME)
  async handleCreateGame(client: Socket, request: GameCreationRequest) {
    const gameId = await this.gameService.createGame(client.id, request.type);
    client.emit(GatewayEventEmitter.GAME_UPDATE, gameId);
  }

  @SubscribeMessage(GatewayEventsListener.START_GAME)
  async handleStartGame(client: Socket, request: TStartRequest) {
    const response = await this.gameService.startGame(client.id, request);
    response.players.forEach((player) => {
      this.server
        .to(player.playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, response, player.playerId);
    });
  }

  @SubscribeMessage(GatewayEventsListener.RESTART_GAME)
  async handleRestartGame(client: Socket, request: TStartRequest) {
    const response = await this.gameService.restartGame(client.id, request);
    response.players.forEach((player) => {
      this.server
        .to(player.playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, response, player.playerId);
    });
  }

  @SubscribeMessage(GatewayEventsListener.JOIN_GAME)
  async handleJoinGame(client: Socket, gameId: string) {
    const players = await this.gameService.join(gameId, client.id);
    client.emit(GatewayEventEmitter.GAME_UPDATE, gameId);
    players.forEach((playerId) => {
      if (playerId != client.id) {
        this.server
          .to(playerId)
          .emit(GatewayEventEmitter.GAME_UPDATE, client.id);
      }
    });
  }

  @SubscribeMessage(GatewayEventsListener.ACTION)
  async handleAction(client: Socket, gameAction: GameActionRequest) {
    const gamePlayResponse = await this.gameService.play(client, gameAction);
    if (gamePlayResponse.end) {
      gamePlayResponse.game.endRound().points.forEach((player) => {
        this.server
          .to(player.player.id)
          .emit(GatewayEventEmitter.END_GAME, player);
      });
    }
    await this.sendGameAction(gamePlayResponse);
  }
}
