// uno-game.ts
import { UnoPlayer, UnoPlayerType } from './uno-player.interface';
import { UnoGameDirection } from './uno-game-direction.enum';
import { UnoCard, UnoCardColor, UnoCardType } from './uno-card.interface';
import { UnoGameMode } from './uno-game-mode.interface';

export class UnoGame {
  public currentTurnIndex = 0;
  public discardPile: UnoCard[] = [];
  public hasStarted = false;
  public direction = UnoGameDirection.CLOCKWISE;
  public players: UnoPlayer[] = [];
  public deck: UnoCard[];

  constructor(
    public readonly id: string,
    public readonly mode: UnoGameMode,
    initialPlayers: UnoPlayer[],
  ) {
    this.players = initialPlayers;
    this.deck = this.generateShuffledDeck();
  }

  start() {
    this.hasStarted = true;
    this.players.forEach((p) => {
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

  playCard(playerId: string, card: UnoCard): boolean {
    const player = this.players.find((p) => p.id === playerId);
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
    this.discardPile.push(card);
    this.advanceTurn();
    return true;
  }

  drawCard(playerId: string): UnoCard[] {
    const player: UnoPlayer = this.players.find((p) => p.id === playerId);
    if (!player) return;

    const drawnCard = this.deck.pop();
    if (drawnCard) {
      player.hand.push(drawnCard);
      this.advanceTurn();
    }

    return player.hand;
  }

  handleBotTurns(): void {
    while (this.players[this.currentTurnIndex].type === UnoPlayerType.BOT) {
      const bot = this.players[this.currentTurnIndex];
      const top = this.discardPile.at(-1);
      const card = bot.hand.find((c) => this.isCardPlayable(c, top));

      if (card) {
        bot.hand = bot.hand.filter((c) => c !== card);
        this.discardPile.push(card);
      } else {
        const drawn = this.deck.pop();
        if (drawn) bot.hand.push(drawn);
      }

      this.advanceTurn();
    }
  }

  declareUno(playerId: string) {
    const player = this.players.find((p) => p.id === playerId);
    if (player?.hand.length === 1) player.declaredUno = true;
  }

  counterUno(targetPlayerId: string) {
    const target = this.players.find((p) => p.id === targetPlayerId);
    if (target && target.hand.length === 1 && !target.declaredUno) {
      target.hand.push(this.deck.pop(), this.deck.pop());
    }
  }

  getPublicState() {
    return {
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        handCount: p.hand.length,
      })),
      topCard: this.discardPile.at(-1),
      currentTurnPlayerId: this.players[this.currentTurnIndex].id,
      direction: this.direction,
    };
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
      (this.currentTurnIndex + delta + this.players.length) %
      this.players.length;
  }

  private generateShuffledDeck(): UnoCard[] {
    const colors = [
      UnoCardColor.RED,
      UnoCardColor.GREEN,
      UnoCardColor.BLUE,
      UnoCardColor.YELLOW,
    ];
    const deck: UnoCard[] = [];

    for (const color of colors) {
      for (let i = 0; i <= 9; i++) {
        deck.push({ color, type: UnoCardType.NUMBER, value: i });
        if (i !== 0) deck.push({ color, type: UnoCardType.NUMBER, value: i });
      }
      for (let i = 0; i < 2; i++) {
        deck.push({ color, type: UnoCardType.SKIP });
        deck.push({ color, type: UnoCardType.REVERSE });
        deck.push({ color, type: UnoCardType.DRAW_TO });
      }
    }
    for (let i = 0; i < 4; i++) {
      deck.push({ color: UnoCardColor.WILD, type: UnoCardType.WILD });
      deck.push({ color: UnoCardColor.WILD, type: UnoCardType.WILD_DRAW_FOUR });
    }

    return deck.sort(() => Math.random() - 0.5);
  }

  getPlayerHand(playerId: string): UnoCard[] {
    return this.players.find((p) => p.id === playerId)?.hand || [];
  }
}
