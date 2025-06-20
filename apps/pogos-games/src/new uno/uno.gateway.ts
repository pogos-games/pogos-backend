import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { UnoService } from './uno.service';
import { GameGateway } from '../../../../libs/tools/src/game/game.gateway';
import { GameStartRequest } from '../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { Socket } from 'socket.io';
import { UnoResponse } from './dto/response/uno-response.interface';
import { UnoPlayerResponse } from './dto/response/uno-player-response.interface';
import { UnoPlayer } from './entities/uno-player.interface';
import { Uno } from './entities/uno.entity';
import { UnoPlayResponse } from './dto/response/uno-play-response.interface';
import { UnoCard } from './entities/uno-card.interface';
import { GatewayEventsListener } from '../../../../libs/tools/src/game/enum/gateway/gateway-events-listener.enum';
import { GatewayEventEmitter } from '../../../../libs/tools/src/game/enum/gateway/gateway-event-emitter.enum';
import { UnoActionRequest } from './dto/request/uno-action-request.interface';
import { GameMode } from '../../../../libs/tools/src/game/enum/game-mode.enum';
import { UnoEndActionType } from './enum/uno-end-action-type.enum';
import { UnoEndAction } from './dto/request/uno-end-action.interface';

// process.env.FRONTEND_URL
@WebSocketGateway({ namespace: 'uno', cors: '*' })
export class UnoGateway extends GameGateway<UnoResponse, UnoPlayerResponse, GameStartRequest, UnoPlayer, Uno, UnoPlayResponse, UnoService, UnoResponse, UnoCard> {
  constructor(private readonly unoService: UnoService) {
    super(unoService);
  }

  async handleDisconnectClientCall(client: Socket) {
    return this.handleDisconnectClient(client, Uno);
  }

  @SubscribeMessage(GatewayEventsListener.ACTION)
  async handleAction(client: Socket, gameAction: UnoActionRequest) {
    this.gameService.play(client, gameAction).then(async (gamePlayResponse) => {
      if (gamePlayResponse.end) {
        gamePlayResponse.game.endRound().points.forEach((player) => {
          this.server
            .to(player.player.id)
            .emit(GatewayEventEmitter.END_GAME, player);
        });
      }
      await this.sendGameAction(gamePlayResponse).then(() => {
        if (gamePlayResponse.game.type === GameMode.SOLO) {
          this.gameService.startBotTurnLoop(gamePlayResponse, (event: UnoPlayResponse) => {
            this.sendGameAction(event);
            if(event.end){
              event.players.forEach((playerId) =>
              this.server
                .to(playerId)
                .emit(GatewayEventEmitter.END_GAME)
              )
            }
          })
        }
      })
    });
  }

  @SubscribeMessage(GatewayEventsListener.UNO_END_ACTION)
  async handleUnoAction(client: Socket, data: UnoEndAction) {
    let gamePlayResponse: UnoPlayResponse;

    switch (data.type) {
      case UnoEndActionType.DECLARE:
        if (!data.playerId) return;
        gamePlayResponse = await this.gameService.declareUno(client,data.roomId, data.playerId);
        break;

      case UnoEndActionType.COUNTER:
        if (!data.targetPlayerId) return;
        gamePlayResponse = await this.gameService.counterUno(client,data.roomId, data.targetPlayerId);
        break;
    }
    gamePlayResponse.players.forEach((playerId) => {
      const sentResponse: UnoResponse = {
        ...(gamePlayResponse.game.toResponse()),
        players: gamePlayResponse.game.toResponse().players.map((responsePlayer: UnoPlayerResponse) => this.privatiseHand(responsePlayer, playerId))
      }
      this.server
        .to(playerId)
        .emit(GatewayEventEmitter.GAME_UPDATE, sentResponse);
    });
  }
}
