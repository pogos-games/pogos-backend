import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GamePlayerResponse } from './dto/response/game-player-response.interface';
import { GatewayEventsListener } from './enum/gateway/gateway-events-listener.enum';
import { GatewayEventEmitter } from './enum/gateway/gateway-event-emitter.enum';
import { GameCreationRequest } from './dto/request/game-creation-request.class';
import { Game, Player } from './entities/game.entity';
import { GameResponse } from './dto/response/game-response.interface';
import { GameActionRequest } from './dto/request/game-action-request.interface';
import { GameStartRequest } from './dto/request/game-start-request.class';
import { GamePlayResponse } from './dto/response/game-play-response.interface';
import { BaseCard } from '../../../../apps/pogos-games/src/cards/model/card.interface';
import { GameJoinRequest } from './dto/request/game-join-request.class';
import { ChatMessage } from '../chat/model/chat-message.interface';

// process.env.FRONTEND_URL
export abstract class GameGateway<
    TResponse extends GameResponse,
    TPlayerResponse extends GamePlayerResponse,
    TStartRequest extends GameStartRequest,
    TPlayer extends Player,
    TGame extends Game<TResponse, TStartRequest, TPlayer, TPlayerResponse, TCard>,
    TPlayResponse extends GamePlayResponse,
    TGameService extends GameService<
      TGame,
      TStartRequest,
      TResponse,
      TPlayerResponse,
      TPlayer,
      TPlayResponse,
      TCard
    >,
    TGameResponse extends GameResponse,
    TCard extends BaseCard
  >
  implements OnGatewayConnection, OnGatewayDisconnect
{
  protected constructor(protected readonly gameService: TGameService) {
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected');
  }

  async handleDisconnect(client: Socket) {
    console.log('Client disconnected');
    this.handleDisconnectClientCall(client).then();
  }

  abstract handleDisconnectClientCall(client: Socket);
  async handleDisconnectClient(client: Socket,
                         GameClass: new (
                           id?: string,
                           deck?: TCard[],
                           leaderId?: string,
                           type?: string
                         ) => TGame): Promise<void>{
    return this.gameService.disconnectClient(client.id, GameClass).then(games => {
      games.forEach(game => game.players.forEach((player) => {
        this.server
          .to(player.id)
          .emit(GatewayEventEmitter.GAME_UPDATE, game.toResponse());
      }));
    });
  }

  protected async sendGameAction(gamePlayResponse: GamePlayResponse) {
    this.server
      .to(gamePlayResponse.currentPlayerId)
      .emit(GatewayEventEmitter.PLAYER_UPDATE, gamePlayResponse.response);
    gamePlayResponse.players.forEach((playerId) => {
      const sentResponse: TResponse = {
        ...(gamePlayResponse.game.toResponse() as TResponse),
        players: gamePlayResponse.game.toResponse().players.map((responsePlayer: TPlayerResponse) => this.privatiseHand(responsePlayer, playerId))
      }
      this.server
        .to(playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, sentResponse);
    });
  }

  protected privatiseHand(gamePlayerResponse: GamePlayerResponse, playerId: string): GamePlayerResponse {
    gamePlayerResponse.hand = gamePlayerResponse.playerId === playerId ? gamePlayerResponse.hand : gamePlayerResponse.hand.map(() => null)
    return gamePlayerResponse;
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
    const game : TGameResponse = await this.gameService.createGame(client.id, request);
    const sentResponse: TGameResponse = {
      ...game,
      players: game.players?.map((responsePlayer: TPlayerResponse) => this.privatiseHand(responsePlayer, client.id))
    }
    client.emit(GatewayEventEmitter.GAME_UPDATE, sentResponse);
  }

  @SubscribeMessage(GatewayEventsListener.START_GAME)
  async handleStartGame(client: Socket, request: TStartRequest) {
    const response = await this.gameService.startGame(client.id, request);
    response.players.forEach((player) => {
      this.server
        .to(player.playerId)
        .emit(GatewayEventEmitter.START_GAME)
      const sentResponse: TResponse = {
        ...response,
        players: response.players.map((responsePlayer: TPlayerResponse) => this.privatiseHand(responsePlayer, player.playerId))
      }
      this.server
        .to(player.playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, sentResponse);
    });
  }

  @SubscribeMessage(GatewayEventsListener.RESTART_GAME)
  async handleRestartGame(client: Socket, request: TStartRequest) {
    const response = await this.gameService.restartGame(client.id, request);
    response.players.forEach((player) => {
      this.server
        .to(player.playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, response);
    });
  }

  @SubscribeMessage(GatewayEventsListener.JOIN_GAME)
  async handleJoinGame(client: Socket, joinRequest: GameJoinRequest) {
    const game = await this.gameService.join(joinRequest, client.id);
    game.players.forEach((player) => {
      this.server
        .to(player.playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, game);
    });
  }

  @SubscribeMessage(GatewayEventsListener.QUIT_GAME)
  async handleQuitGame(client: Socket, gameId: {gameId: string}) {
    const game = await this.gameService.quit(gameId.gameId, client.id);
    client.emit(GatewayEventEmitter.GAME_UPDATE, gameId.gameId);
    game.players.forEach((player) => {
      if (player.id != client.id) {
        this.server
          .to(player.id)
          .emit(GatewayEventEmitter.GAME_UPDATE, game.toResponse());
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

  @SubscribeMessage(GatewayEventsListener.CHAT)
  async handleChat(@MessageBody() payload: ChatMessage) {
    console.log('chat received:', payload);
    this.gameService.getGame(payload.gameId).then((game)=> {
      game.players.forEach(player =>
        this.server.to(player.id).emit(GatewayEventsListener.CHAT, payload)
      )
    })
  }
}
