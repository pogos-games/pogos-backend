

export interface UnoGame {
  id: string;
  players: Player[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentColor: UnoColor;
  direction: 1 | -1; // 1 for clockwise, -1 for counterclockwise
  currentPlayerIndex: number;
  isStarted: boolean;
}
