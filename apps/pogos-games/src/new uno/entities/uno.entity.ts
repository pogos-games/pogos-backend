import { Expose } from 'class-transformer';
import { Game } from 'libs/tools/src/game/entities/game.entity';
import { GameStatus } from 'libs/tools/src/game/enum/game-status.enum';
import { UnoPlayer, UnoPlayerType } from './uno-player.interface';
import { UnoResponse } from '../dto/response/uno-response.interface';
import { UnoPlayerResponse } from '../dto/response/uno-player-response.interface';
import { UnoGameDirection } from '../enum/uno-game-direction.enum';
import { UnoCard, UnoCardColor, UnoCardType } from './uno-card.interface';
import { UnoActionRequest } from '../dto/request/uno-action-request.interface';
import { v4 as uuidv4 } from 'uuid';
import { Avatar } from '../../../../../libs/tools/src/game/enum/avatar.enum';
import { UnoActionType } from '../enum/uno-action.interface';
import { GameMode } from '../../../../../libs/tools/src/game/enum/game-mode.enum';
import { GameType } from '../../../../../libs/tools/src/game/enum/game-type.enum';
import { GameEndResponse } from '../../../../../libs/tools/src/game/dto/response/game-end-response.interface';
import { UnoStartRequest } from '../../poker/dto/request/uno-start-request.class';

export class Uno extends Game<UnoResponse, UnoStartRequest, UnoPlayer, UnoPlayerResponse, UnoCard> {

  @Expose()
  _players: UnoPlayer[] = [];

  @Expose()
  public readonly _type: GameType = GameType.UNO;

  public discardPile: UnoCard[] = [];
  public currentTurnIndex = 0;
  public direction = UnoGameDirection.CLOCKWISE;
  protected _deck: UnoCard[];
  public winnerUsername?: string = "";

  constructor(
    id?: string,
    deck?: UnoCard[],
    leaderId?: string,
    type?: GameMode,
  ) {
    super(id,deck,leaderId,type)
    this._status = GameStatus.WAITING
  }

  play(player: UnoPlayer, action: UnoActionRequest): boolean {
    this._players.forEach(p => {
      p.declaredUno = p.declaredUno && p.hand.length == 1
    })
    if (action.action === UnoActionType.DRAW_CARD) {
      this._players.forEach((currentplayer) => {
        if (currentplayer.id === player.id) {
          currentplayer.hand.push(this.drawCard(this.deck));
          this.advanceTurn();
        }
      })
      return false
    }
    if (action.action === UnoActionType.PLAY_CARD) {
      const currentPlayer: UnoPlayer = this._players[this.currentTurnIndex]
      if (!currentPlayer) {
        throw new Error('Player not found');
      }
      if (player != currentPlayer) {
        throw new Error('You are not allowed to play right now');
      }
      const topCard = this.discardPile.at(-1);
      if (!topCard || !this.isCardPlayable(action.card, topCard)) return false;

      const index = player.hand.findIndex(
        (c) =>
          c.type === action.card.type &&
          c.color === action.card.color &&
          c.value === action.card.value,
      );
      if (index === -1) return false;

      player.hand.splice(index, 1);
      if (
        action.card.type === UnoCardType.WILD ||
        action.card.type === UnoCardType.WILD_DRAW_FOUR
      ) {
        if (!action.card.declaredColor || action.card.declaredColor === UnoCardColor.WILD) return false;
        this.discardPile.push({ ...action.card, color: action.card.declaredColor });
      } else {
        this.discardPile.push(action.card);
      }

      // Gérer les effets spéciaux
      this.switchCard(action.card.type)

      if (player.hand.length === 0) {
        this.winnerUsername = player.username;
        return true
      }
    }
    return false;
  }

  playCard(
    playerId: string,
    card: UnoCard,
    declaredColor?: UnoCardColor,
  ): boolean {
    const player = this._players.find((p) => p.id === playerId);
    if (!player) return false;

    const topCard = this.discardPile.at(-1);
    if (!topCard || !this.isCardPlayable(card, topCard)) return false;

    const index = player.hand.findIndex(
      (c) =>
        c.type === card.type &&
        c.color === card.color &&
        c.value === card.value,
    );
    if (index === -1) return false;

    player.hand.splice(index, 1);

    if (
      card.type === UnoCardType.WILD ||
      card.type === UnoCardType.WILD_DRAW_FOUR
    ) {
      if (!declaredColor || declaredColor === UnoCardColor.WILD) return false;
      this.discardPile.push({ ...card, color: declaredColor });
    } else {
      this.discardPile.push(card);
    }

    // Gérer les effets spéciaux
    this.switchCard(card.type)

    if (player.hand.length === 0) {
      this.status = GameStatus.ENDED;
      this.winnerUsername = player.username;
    }

    return true;
  }

  private switchCard(type){
    switch (type) {
      case UnoCardType.REVERSE:
        this.direction =
          this.direction === UnoGameDirection.CLOCKWISE
            ? UnoGameDirection.COUNTERCLOCKWISE
            : UnoGameDirection.CLOCKWISE;
        this.advanceTurn();
        break;

      case UnoCardType.SKIP:
        this.advanceTurn();
        this.advanceTurn();
        break;

      case UnoCardType.DRAW_TO:
        this.advanceTurn();
        this.drawCards(this._players[this.currentTurnIndex], 2);
        break;

      case UnoCardType.WILD_DRAW_FOUR:
        this.advanceTurn();
        this.drawCards(this._players[this.currentTurnIndex], 4);
        break;

      default:
        this.advanceTurn();
        break;
    }
  }

  isCurrentPlayerABot(): boolean {
    return this._players[this.currentTurnIndex].type === UnoPlayerType.BOT;
  }

  public removeUser(userId: string): void {
    this._players = this._players.filter((player) => player.id !== userId);
    if (this.currentTurnIndex == this._players.length){
      this.advanceTurn()
    }
  }

  public checkNoPlayerLeft(): boolean{
    return this._players.length == 0 || this._players.every(p => p.type == UnoPlayerType.BOT)
  }

  toResponse(): UnoResponse {
    const players: UnoPlayerResponse[] = this._players.map((player) => ({
      playerId: player.id,
      username: player.username,
      avatar: player.avatar,
      hand: player.hand,
      declaredUno: player.declaredUno
    }));

    return {
      gameId: this._id,
      status: this._status,
      discardPile: this.discardPile,
      players: players,
      deck: this.deck.map(() => null),
      currentTurnPlayerId: this._players[this.currentTurnIndex].id,
      direction: this.direction,
      winnerUsername: this.winnerUsername,
      mode: this.mode
    } as UnoResponse;
  }

  public startGame(request: UnoStartRequest) {
    super.startGame(request)
    this._deck = this.shuffle(request.deck ?? this._deck)
    if (this._players.length < 2 && this.mode == GameMode.MULTIPLAYER) {
      throw new Error('Insufficient players to start the game.');
    }
    this._mode = request.mode
    if (request.mode === GameMode.SOLO) {
      for (let i = 1; i <= 3; i++) {
        this._players.push({
          id: uuidv4(),
          username: `Bot ${i}`,
          avatar: Avatar.ROBOCOP,
          type: UnoPlayerType.BOT,
          hand: [],
          declaredUno: false
        });
      }
    }
    this._players.forEach((p) => {
      for (let i = 0; i < 7; i++) {
        p.hand.push(this.deck.pop());
      }
    });

    let firstCard: UnoCard;
    do {
      firstCard = this.deck.pop()!;
    } while (firstCard.type !== UnoCardType.NUMBER);

    this.discardPile.push(firstCard);
  }

  public restartGame(UnoStartRequest: UnoStartRequest) {
    this.clearHands()
    this.startGame(UnoStartRequest);
  }

  public addUser(userId: string, avatar: Avatar, playerName: string) {
    if (this.status !== GameStatus.WAITING) {
      throw new Error('Cannot add user to a game that has already started');
    }
    this._players.push({
      avatar: avatar,
      declaredUno: false,
      hand: [],
      type: UnoPlayerType.HUMAN,
      id: userId,
      username: playerName
    });
  }

  private isCardPlayable(card: UnoCard, top: UnoCard): boolean {
    return (
      card.color === UnoCardColor.WILD ||
      card.color === top.color ||
      card.type === top.type ||
      (card.type === UnoCardType.NUMBER &&
        top.type === UnoCardType.NUMBER &&
        card.value === top.value)
    );
  }

  private advanceTurn() {
    const delta = this.direction === UnoGameDirection.CLOCKWISE ? 1 : -1;
    this.currentTurnIndex =
      (this.currentTurnIndex + delta + this._players.length) %
      this._players.length;
  }

  private drawCards(player: UnoPlayer, count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.deck.pop();
      if (card) {
        player.hand.push(card);
      }
    }
  }

  playBotTurn(): string{
    const player = this._players[this.currentTurnIndex];
    if (player.type !== UnoPlayerType.BOT) {
      return ""
    }

    const topCard = this.discardPile.at(-1);
    const hand = player.hand;
    let declaredColor: UnoCardColor | undefined;

    // Cherche une carte jouable dans la main
    const playableCard = hand.find((card) =>
      this.isCardPlayable(card, topCard),
    );

    if (playableCard) {
      // Si la carte est une carte Joker, choisir une couleur
      if (
        playableCard.type === UnoCardType.WILD ||
        playableCard.type === UnoCardType.WILD_DRAW_FOUR
      ) {
        declaredColor = this.getMostFrequentColor(hand);
      }

      if (this.playCard(player.id, playableCard, declaredColor)) return player.hand.length == 1 ? player.id : "";
    } else {
      // Aucune carte jouable → on pioche une seule carte, et on ne la joue pas
      const drawnCard = this.deck.pop();
      if (drawnCard) {
        player.hand.push(drawnCard);
        this.advanceTurn();
        return ""
      }
    }

    // Si la pioche est vide (par sécurité)
    this.advanceTurn();
  }

  private getMostFrequentColor(hand: UnoCard[]): UnoCardColor {
    const colorCount: Record<UnoCardColor, number> = {
      RED: 0,
      GREEN: 0,
      BLUE: 0,
      YELLOW: 0,
      WILD: 0,
    };

    for (const card of hand) {
      if (card.color !== 'WILD') {
        colorCount[card.color]++;
      }
    }

    return Object.entries(colorCount).sort(
      (a, b) => b[1] - a[1],
    )[0][0] as UnoCardColor;
  }

  declareUno(playerId: string) {
    const player = this._players.find((p) => p.id === playerId);
    if (player?.hand.length === 1) player.declaredUno = true;
  }

  counterUno(targetPlayerId: string) {
    const target = this._players.find((p) => p.id === targetPlayerId);
    if (target && target.hand.length === 1 && !target.declaredUno) {
      target.hand.push(this.deck.pop(), this.deck.pop());
    }
  }

  endRound(): GameEndResponse {
    this.clearHands();
    const gains = this._players.map((player: UnoPlayer) => {
      let points = 0
      if(player.hand.length == 0){
        points = 150
      }
      return {player: player, points: points}
    });
    return { end: true, points: gains } as GameEndResponse;
  }

  clearHands() {
    this._players.map(p => p.hand = [])
  }
}
