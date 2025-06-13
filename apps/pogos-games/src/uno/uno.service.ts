// uno.service.ts
import {
  GameEvent,
  UnoGameEventTarget,
} from './model/uno-game-event.interface';
import { Injectable } from '@nestjs/common';
import { UnoGame } from './model/uno-game.class';
import { UnoPlayer, UnoPlayerType } from './model/uno-player.interface';
import { UnoCard, UnoCardColor } from './model/uno-card.interface';
import { IdGeneratorService } from '../../../../libs/tools-library/src/id-generator.service';
import { v4 as uuidv4 } from 'uuid';
import { UnoGatewayEventEmit } from './model/uno-gateway-event-emit.enum';
import { Avatar } from '../../../../libs/tools/src/game/enum/avatar.enum';
import { GameStatus } from '../../../../libs/tools/src/game/enum/game-status.enum';
import { GameType } from '../../../../libs/tools/src/game/enum/game-type.enum';

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

  getGameIdByPlayer(playerId: string): string {
    for (const [gameId, game] of this.games.entries()) {
      if (game.players.some((player) => player.id === playerId)) {
        return gameId;
      }
    }
    return '';
  }

  public isSoloGame(gameId: string): boolean {
    const game: UnoGame = this.getGameById(gameId);
    return game ? game.mode === GameType.SOLO : false;
  }

  async createGame(
    clientId: string,
    playerName: string,
    avatar: Avatar,
    mode: GameType,
  ): Promise<{ game: UnoGame; events: GameEvent[] }> {
    const roomId = await this.idGeneratorService.generateUniqueId('#', 'uno');

    const players: UnoPlayer[] = [
      {
        id: clientId,
        name: playerName,
        avatar: avatar,
        type: UnoPlayerType.HUMAN,
        hand: [],
        declaredUno: false,
      },
    ];

    if (mode === GameType.SOLO) {
      for (let i = 1; i <= 3; i++) {
        players.push({
          id: uuidv4(),
          name: `Bot ${i}`,
          avatar: Avatar.ROBOCOP,
          type: UnoPlayerType.BOT,
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
      game.mode === GameType.SOLO
        ? game.players.filter((p) => p.type !== UnoPlayerType.BOT)
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

  playCard(
    roomId: string,
    playerId: string,
    card: UnoCard,
    declaredColor?: UnoCardColor,
  ): GameEvent[] {
    const game: UnoGame = this.games.get(roomId);
    if (!game) return [];

    const events: GameEvent[] = [];

    const result = game.playCard(playerId, card, declaredColor);
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

      // 🔐 Mise à jour de la main privée du joueur
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

      const player = game.players.find((p) => p.id === playerId);
      if (player && player.hand.length === 0) {
        console.log('sending game ended event');
        game.status = GameStatus.ENDED;
        game.winnerUsername = player.name;

        events.push({
          type: UnoGatewayEventEmit.GAME_ENDED,
          target: UnoGameEventTarget.ROOM,
          targetId: roomId,
          payload: {
            winner: player.name,
            winnerId: player.id,
          },
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

  getGameById(gameId: string): UnoGame | undefined {
    return this.games.get(gameId);
  }

  async startBotTurnLoop(gameId: string, callback: (event: GameEvent) => void) {
    const game: UnoGame = this.getGameById(gameId);
    if (!game) return;

    let continuePlaying = true;

    while (continuePlaying && game.isCurrentPlayerABot()) {
      await this.delay(1500);

      const result = game.playBotTurn();

      const events: GameEvent[] = [];

      if (result.playedCard) {
        events.push({
          type: UnoGatewayEventEmit.CARD_PLAYED,
          targetId: gameId,
          target: UnoGameEventTarget.ROOM,
          payload: {
            playerId: result.playerId,
            card: result.playedCard,
            declaredColor: result.declaredColor,
          },
        });
      } else if (result.drawnCard) {
        events.push({
          type: UnoGatewayEventEmit.CARD_DRAWN,
          targetId: gameId,
          target: UnoGameEventTarget.ROOM,
          payload: {
            playerId: result.playerId,
            card: result.drawnCard,
          },
        });
      }

      // ⬇️ Mise à jour de l'état global
      events.push({
        type: UnoGatewayEventEmit.GAME_STATE,
        targetId: gameId,
        target: UnoGameEventTarget.ROOM,
        payload: { state: game.getPublicState() },
      });

      // 🔐 Mise à jour de la main privée du bot (optionnel, utile si affiché pour debug)
      const clientId = this.playerToClient.get(result.playerId);
      if (clientId) {
        events.push({
          type: UnoGatewayEventEmit.PRIVATE_STATE,
          target: UnoGameEventTarget.PLAYER,
          targetId: clientId,
          payload: {
            hand: game.getPlayerHand(result.playerId),
            playerId: result.playerId,
          },
        });
      }

      // 🏁 Vérification si le bot a gagné
      const botPlayer = game.players.find((p) => p.id === result.playerId);
      if (botPlayer && botPlayer.hand.length === 0) {
        game.status = GameStatus.ENDED;
        game.winnerUsername = botPlayer.name;

        events.push({
          type: UnoGatewayEventEmit.GAME_ENDED,
          target: UnoGameEventTarget.ROOM,
          targetId: gameId,
          payload: {
            winner: botPlayer.name,
            winnerId: botPlayer.id,
          },
        });

        // On stoppe la boucle immédiatement si le bot a gagné
        continuePlaying = false;
      } else {
        continuePlaying = game.isCurrentPlayerABot();
      }

      for (const event of events) {
        callback(event);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
