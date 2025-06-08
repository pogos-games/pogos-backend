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

  playCard(
    playerId: string,
    card: UnoCard,
    declaredColor?: UnoCardColor,
  ): boolean {
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

    // Pour les cartes WILD ou WILD_DRAW_FOUR, on applique la couleur déclarée
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
    switch (card.type) {
      case UnoCardType.REVERSE:
        this.direction =
          this.direction === UnoGameDirection.CLOCKWISE
            ? UnoGameDirection.COUNTERCLOCKWISE
            : UnoGameDirection.CLOCKWISE;
        // Si 2 joueurs : reverse = skip
        if (this.players.length === 2) this.advanceTurn();
        break;

      case UnoCardType.SKIP:
        this.advanceTurn(); // passe au suivant joueur
        this.advanceTurn(); // skip son tour
        break;

      case UnoCardType.DRAW_TO:
        this.advanceTurn(); // cibler prochain joueur
        this.drawCards(this.players[this.currentTurnIndex], 2);
        break;

      case UnoCardType.WILD_DRAW_FOUR:
        this.advanceTurn();
        this.drawCards(this.players[this.currentTurnIndex], 4);
        break;
      default:
        this.advanceTurn();
        break;
    }
    return true;
  }

  private drawCards(player: UnoPlayer, count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.deck.pop();
      if (card) {
        player.hand.push(card);
      }
    }
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

  playBotTurn(): {
    playedCard?: UnoCard;
    declaredColor?: UnoCardColor;
    drawnCard?: UnoCard;
    playerId: string;
  } {
    const player = this.players[this.currentTurnIndex];
    if (player.type !== UnoPlayerType.BOT) {
      return { playerId: player.id };
    }

    const topCard = this.discardPile.at(-1);
    const hand = player.hand;
    let declaredColor: UnoCardColor | undefined;

    // Cherche une carte jouable dans la main
    const playableCard = hand.find((card) =>
      this.isCardPlayable(card, topCard)
    );

    if (playableCard) {
      // Si la carte est une carte Joker, choisir une couleur
      if (
        playableCard.type === UnoCardType.WILD ||
        playableCard.type === UnoCardType.WILD_DRAW_FOUR
      ) {
        declaredColor = this.getMostFrequentColor(hand);
      }

      const success = this.playCard(player.id, playableCard, declaredColor);
      if (success) {
        return {
          playerId: player.id,
          playedCard: playableCard,
          declaredColor,
        };
      }
    } else {
      // Aucune carte jouable → on pioche une seule carte, et on ne la joue pas
      const drawnCard = this.deck.pop();
      if (drawnCard) {
        player.hand.push(drawnCard);
        this.advanceTurn();
        return {
          playerId: player.id,
          drawnCard,
        };
      }
    }

    // Si la pioche est vide (par sécurité)
    this.advanceTurn();
    return { playerId: player.id };
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
        avatar: p.avatar,
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

  isCurrentPlayerABot(): boolean {
    return this.players[this.currentTurnIndex].type === UnoPlayerType.BOT;
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
}
