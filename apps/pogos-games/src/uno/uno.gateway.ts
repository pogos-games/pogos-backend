// uno.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UnoService } from './uno.service';
import { UnoGameMode } from './model/uno-game-mode.interface';
import { GameEvent } from './model/uno-game-event.interface';
import { GatewayEventsListener } from '../../../../libs/tools/src/game/enum/gateway/gateway-events-listener.enum';
import { UnoEndAction } from './model/uno-end-action.interface';
import { UnoEndActionType } from './model/uno-end-action-type.enum';
import { UnoAction, UnoActionType } from './model/uno-action.interface';
import { ChatGateway } from '../../../../libs/tools/src/chat/chat.gateway';
import { Avatar } from '../../../../libs/tools/src/game/enum/avatar.enum';

@WebSocketGateway({ namespace: 'uno', cors: '*' })
export class UnoGateway
  extends ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly clientRoomMap = new Map<string, string>();

  constructor(private readonly gameService: UnoService) {
    super();
  }

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
    @MessageBody()
    data: { playerName: string; mode: UnoGameMode; avatar: Avatar },
    @ConnectedSocket() client: Socket,
  ) {
    this.gameService.registerPlayerSocket(client.id, client.id);

    const { game, events } = await this.gameService.createGame(
      client.id,
      data.playerName,
      data.avatar,
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

    if (action.type === UnoActionType.PLAY_CARD) {
      this.dispatchEvents(
        this.gameService.playCard(
          action.roomId,
          action.playerId,
          action.card,
          action.declaredColor,
        ),
      );
    }

    if (action.type === UnoActionType.DRAW_CARD) {
      this.dispatchEvents(
        this.gameService.drawCard(action.roomId, action.playerId),
      );
    }

    const gameId = this.gameService.getGameIdByPlayer(action.playerId);
    const isSolo = this.gameService.isSoloGame(gameId);

    if (isSolo) {
      this.gameService.startBotTurnLoop(gameId, (event: GameEvent) => {

        this.dispatchEvent(event);
      });
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
      this.dispatchEvent(event);
    }
  }

  dispatchEvent(event: GameEvent) {
    this.server.to(event.targetId).emit(event.type, event.payload);
  }
}
