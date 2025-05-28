// uno.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnoService } from './uno.service';
import { UnoGameMode } from './model/uno-game-mode.interface';
import { GameEvent } from './model/uno-game-event.interface';
import { GatewayEventsListener } from '../../../../libs/tools/src/game/enum/gateway/gateway-events-listener.enum';
import { UnoEndAction } from './model/uno-end-action.interface';
import { UnoEndActionType } from './model/uno-end-action-type.enum';
import { UnoAction, UnoActionType } from './model/uno-action.interface';

@WebSocketGateway({ namespace: 'uno', cors: '*' })
export class UnoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly clientRoomMap = new Map<string, string>();

  constructor(private readonly gameService: UnoService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.gameService.unregisterSocket(client.id);

    const roomId = this.clientRoomMap.get(client.id);
    if (roomId) {
      client.leave(roomId);
      this.clientRoomMap.delete(client.id);
    }
  }

  @SubscribeMessage(GatewayEventsListener.CREATE_GAME)
  async handleCreateGame(
    @MessageBody() data: { playerName: string; mode: UnoGameMode },
    @ConnectedSocket() client: Socket,
  ) {
    this.gameService.registerPlayerSocket(client.id, client.id);

    const { game, events } = await this.gameService.createGame(
      client.id,
      data.playerName,
      data.mode,
    );

    this.clientRoomMap.set(client.id, game.id);
    client.join(game.id);

    this.dispatchEvents(events);

    // Auto-start game if mode is SOLO
    if (data.mode === 'SOLO') {
      const startEvents = this.gameService.startGame(game.id);
      this.dispatchEvents(startEvents);
    }

    // to implement for multiplayer
  }

  @SubscribeMessage(GatewayEventsListener.START_GAME)
  handleStartGame(@MessageBody() roomId: string) {
    const events = this.gameService.startGame(roomId);
    this.dispatchEvents(events);
  }

  @SubscribeMessage(GatewayEventsListener.ACTION)
  handlePlayCard(@MessageBody() action: UnoAction) {
    if (action.type === UnoActionType.PLAY_CARD)
      this.dispatchEvents(
        this.gameService.playCard(action.roomId, action.playerId, action.card),
      );
    if (action.type === UnoActionType.DRAW_CARD) {
      this.dispatchEvents(
        this.gameService.drawCard(action.roomId, action.playerId),
      );
    }
  }

  @SubscribeMessage(GatewayEventsListener.UNO_END_ACTION)
  handleUnoAction(@MessageBody() data: UnoEndAction) {
    let events: GameEvent[] = [];

    switch (data.type) {
      case UnoEndActionType.DECLARE:
        if (!data.playerId) return;
        events = this.gameService.declareUno(data.roomId, data.playerId);
        break;

      case UnoEndActionType.COUNTER:
        if (!data.targetPlayerId) return;
        events = this.gameService.counterUno(data.roomId, data.targetPlayerId);
        break;
    }

    this.dispatchEvents(events);
  }

  private dispatchEvents(events: GameEvent[]) {
    for (const event of events) {
      this.server.to(event.targetId).emit(event.type, event.payload);
    }
  }
}
