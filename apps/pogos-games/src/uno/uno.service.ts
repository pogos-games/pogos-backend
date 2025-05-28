// uno.service.ts
import {
  GameEvent,
  UnoGameEventTarget,
} from './model/uno-game-event.interface';
import { Injectable } from '@nestjs/common';
import { UnoGameMode } from './model/uno-game-mode.interface';
import { UnoGame } from './model/uno-game.class';
import { UnoPlayer, UnoPlayerType } from './model/uno-player.interface';
import { UnoCard } from './model/uno-card.interface';
import { IdGeneratorService } from '../../../../libs/tools-library/src/id-generator.service';
import { v4 as uuidv4 } from 'uuid';
import { UnoGatewayEventEmit } from './model/uno-gateway-event-emit.enum';

@Injectable()
export class UnoService {
  private readonly games = new Map<string, UnoGame>();
  private readonly playerToClient = new Map<string, string>(); // map playerId -> socketId
  constructor(private readonly idGeneratorService: IdGeneratorService) {}

  registerPlayerSocket(playerId: string, clientId: string) {
    this.playerToClient.set(playerId, clientId);
  }

  unregisterSocket(clientId: string) {
    for (const [playerId, socket] of this.playerToClient.entries()) {
      if (socket === clientId) {
        this.playerToClient.delete(playerId);
      }
    }
  }

  async createGame(
    clientId: string,
    playerName: string,
    mode: UnoGameMode,
  ): Promise<{ game: UnoGame; events: GameEvent[] }> {
    const roomId = await this.idGeneratorService.generateUniqueId('#', 'uno');

    const players: UnoPlayer[] = [
      {
        id: clientId,
        name: playerName,
        type: UnoPlayerType.Human,
        hand: [],
        declaredUno: false,
      },
    ];

    if (mode === UnoGameMode.SOLO) {
      for (let i = 1; i <= 3; i++) {
        players.push({
          id: uuidv4(),
          name: `Bot ${i}`,
          type: UnoPlayerType.Bot,
          hand: [],
          declaredUno: false,
        });
      }
    }

    const game = new UnoGame(roomId, mode, players);
    this.games.set(roomId, game);

    return {
      game,
      events: [
        {
          type: UnoGatewayEventEmit.GAME_CREATED,
          target: UnoGameEventTarget.PLAYER,
          targetId: clientId,
          payload: {
            gameId: game.id,
            playerId: clientId,
          },
        },
      ],
    };
  }

  startGame(roomId: string): GameEvent[] {
    const game = this.games.get(roomId);
    if (!game) return [];

    game.start();

    const events: GameEvent[] = [
      {
        type: UnoGatewayEventEmit.GAME_STARTED,
        target: UnoGameEventTarget.ROOM,
        targetId: roomId,
        payload: { state: game.getPublicState() },
      },
      {
        type: UnoGatewayEventEmit.GAME_STATE,
        target: UnoGameEventTarget.ROOM,
        targetId: game.id,
        payload: { state: game.getPublicState() },
      },
    ];

    const playersToNotify =
      game.mode === UnoGameMode.SOLO
        ? game.players.filter((p) => p.type !== UnoPlayerType.Bot)
        : game.players;

    for (const player of playersToNotify) {
      events.push({
        type: UnoGatewayEventEmit.PRIVATE_STATE,
        target: UnoGameEventTarget.PLAYER,
        targetId: player.id,
        payload: { hand: player.hand },
      });
    }

    return events;
  }

  playCard(roomId: string, playerId: string, card: UnoCard): GameEvent[] {
    const game: UnoGame = this.games.get(roomId);
    if (!game) return [];

    const events: GameEvent[] = [];

    const result = game.playCard(playerId, card);
    if (result) {
      events.push({
        type: UnoGatewayEventEmit.CARD_PLAYED,
        target: UnoGameEventTarget.ROOM,
        targetId: roomId,
        payload: { playerId, card },
      });

      events.push({
        type: UnoGatewayEventEmit.GAME_STATE,
        target: UnoGameEventTarget.ROOM,
        targetId: roomId,
        payload: { state: game.getPublicState() },
      });

      // 🆕 Ajouter ça pour renvoyer les cartes au joueur qui vient de jouer
      const clientId = this.playerToClient.get(playerId);
      if (clientId) {
        events.push({
          type: UnoGatewayEventEmit.PRIVATE_STATE,
          target: UnoGameEventTarget.PLAYER,
          targetId: clientId,
          payload: {
            hand: game.getPlayerHand(playerId),
            playerId,
          },
        });
      }

      if (game.mode === UnoGameMode.SOLO) {
        game.handleBotTurns();
        // return game state updated due to bot
        events.push({
          type: UnoGatewayEventEmit.GAME_STATE,
          target: UnoGameEventTarget.ROOM,
          targetId: roomId,
          payload: { state: game.getPublicState() },
        });
      }
    }

    return events;
  }

  declareUno(roomId: string, playerId: string): GameEvent[] {
    const game = this.games.get(roomId);
    if (!game) return [];

    game.declareUno(playerId);

    return [
      {
        type: UnoGatewayEventEmit.UNO_DECLARED,
        target: UnoGameEventTarget.ROOM,
        targetId: roomId,
        payload: { playerId },
      },
    ];
  }

  counterUno(roomId: string, targetPlayerId: string): GameEvent[] {
    const game = this.games.get(roomId);
    if (!game) return [];

    game.counterUno(targetPlayerId);

    return [
      {
        type: UnoGatewayEventEmit.UNO_COUNTERED,
        target: UnoGameEventTarget.ROOM,
        targetId: roomId,
        payload: { targetPlayerId },
      },
    ];
  }

  drawCard(roomId: string, playerId: string): GameEvent[] {
    const game: UnoGame = this.games.get(roomId);
    if (!game) return [];

    const playerHand: UnoCard[] = game.drawCard(playerId);
    if (game.mode == UnoGameMode.SOLO) {
      game.handleBotTurns();
    }
    return [
      {
        type: UnoGatewayEventEmit.PRIVATE_STATE,
        target: UnoGameEventTarget.PLAYER,
        targetId: playerId,
        payload: { hand: playerHand },
      },
      {
        type: UnoGatewayEventEmit.GAME_STATE,
        target: UnoGameEventTarget.ROOM,
        targetId: roomId,
        payload: { state: game.getPublicState() },
      },
    ];
  }
}
