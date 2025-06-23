import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameService } from '../../../../libs/tools/src/game/game.service';
import { RedisService } from '../../../../libs/tools-library/src/redis/redis.service';
import { IdGeneratorService } from '../../../../libs/tools-library/src/id-generator.service';
import { GameStartRequest } from '../../../../libs/tools/src/game/dto/request/game-start-request.class';
import { UnoResponse } from './dto/response/uno-response.interface';
import { UnoPlayerResponse } from './dto/response/uno-player-response.interface';
import { UnoPlayer } from './entities/uno-player.interface';
import { UnoPlayResponse } from './dto/response/uno-play-response.interface';
import { UnoCard } from './entities/uno-card.interface';
import { UnoActionRequest } from './dto/request/uno-action-request.interface';
import { Uno } from './entities/uno.entity';
import { UnoCardsService } from './uno-cards.service';
import { GameStatus } from '../../../../libs/tools/src/game/enum/game-status.enum';
import { GameCreationRequest } from '../../../../libs/tools/src/game/dto/request/game-creation-request.class';
import { GameJoinRequest } from '../../../../libs/tools/src/game/dto/request/game-join-request.class';
import { GameMode } from '../../../../libs/tools/src/game/enum/game-mode.enum';

@Injectable()
export class UnoService extends GameService<Uno, GameStartRequest, UnoResponse, UnoPlayerResponse, UnoPlayer, UnoPlayResponse, UnoCard> {
  protected GAME_KEY_PREFIX = 'uno';

  constructor(
    protected readonly redisService: RedisService,
    protected readonly cardsService: UnoCardsService,
    protected readonly idGeneratorService: IdGeneratorService
  ) {super(redisService,cardsService,idGeneratorService)}
  async createGame(leaderId: string, creationRequest: GameCreationRequest) {
    return (await super.create(leaderId, creationRequest, Uno)).toResponse()
  }

  async join(joinRequest: GameJoinRequest, playerId: string){
    return await super.joinGame(joinRequest, playerId, Uno);
  }

  async quit(gameId: string, playerId: string){
    return await super.quitGame(gameId, playerId, Uno);
  }


  mapResponse<UnoPlayerResponse>(player: UnoPlayer, players: string[]): { players: string[], response: UnoPlayerResponse } {
    return {
      players,
      response: {
        playerId: player.id,
        hand: player.hand,
        declaredUno: player.declaredUno
      } as UnoPlayerResponse,
    };
  }

  async startGame<UnoResponse>(clientId: string, request: GameStartRequest) {
    if (Object.values(GameMode).includes(request.mode)) {
      return await this.start(clientId, request.gameId, Uno, request);
    } else {
      throw new Error('Wrong game type');
    }
  }

  restartGame(clientId: string, request: GameStartRequest) {
    return this.startGame(clientId, request)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected checkEnd(game: Uno): boolean {
    return game.winnerUsername != "" && game._players.some(p => p.hand.length == 0);
  }

  play(client: Socket, gameAction: UnoActionRequest): Promise<UnoPlayResponse> {
    return this.playAction<UnoPlayResponse>(
      client,
      gameAction,
      Uno,
      this.mapResponse
    );
  }

  async startBotTurnLoop(unoPlayResponse: UnoPlayResponse, callback: (event: UnoPlayResponse) => void){
    let continuePlaying = true;

    while (continuePlaying && unoPlayResponse.game.isCurrentPlayerABot()) {
      await this.delay(2000);

      const key = `${this.GAME_KEY_PREFIX}:${unoPlayResponse.game.id}`;
      unoPlayResponse.game = await this.redisService.get<Uno>(key,Uno)

      const callUnoBotId = unoPlayResponse.game.playBotTurn();

      // 🏁 Vérification si le bot a gagné
      if (this.checkEnd(unoPlayResponse.game)) {
        unoPlayResponse.game.status = GameStatus.ENDED;
        unoPlayResponse.end = true

        // On stoppe la boucle immédiatement si le bot a gagné
        continuePlaying = false;
      } else {
        continuePlaying = unoPlayResponse.game.isCurrentPlayerABot();
      }
      await this.saveGame(unoPlayResponse.game);
      callback(unoPlayResponse);

      if(callUnoBotId != ""){
        await this.delay(Math.floor(Math.random() * 5001))
        unoPlayResponse.game.declareUno(callUnoBotId)
        callback(unoPlayResponse)
      }
    }

  }

  async declareUno(client: Socket, roomId: string, playerId: string): Promise<UnoPlayResponse> {
    const game = await this.redisService
      .get<Uno>(`${this.GAME_KEY_PREFIX}:${roomId}`, Uno)
      .then((game) => game);

    if (!game) return ;

    game.declareUno(playerId);
    await this.saveGame(game)
    
    return this.toPlayResponse(client, game)
  }

  async counterUno(client: Socket, roomId: string, targetPlayerId: string): Promise<UnoPlayResponse> {
    const game = await this.redisService
      .get<Uno>(`${this.GAME_KEY_PREFIX}:${roomId}`, Uno)
      .then((game) => game);

    if (!game) return;

    game.counterUno(targetPlayerId);
    await this.saveGame(game)
    return this.toPlayResponse(client, game)
  }

  private async toPlayResponse(client: Socket, game: Uno): Promise<UnoPlayResponse> {

    await this.saveGame(game)

    const players = game._players.map((player) => player.id);
    const player = game._players.find(p => p.id === client.id)

    const response = this.mapResponse(player, players)
    return {
      players: players,
      end: false,
      response: response.response,
      game: game,
      currentPlayerId: game._players[game.currentTurnIndex].id
    } as UnoPlayResponse
  }

  async persistGameToHistory(gameId: string): Promise<void> {
    await this.persistGameHistory(gameId, Uno)
  }

  async getGame(gameId: string){
    return this.findGame(gameId, Uno)
  };
}
