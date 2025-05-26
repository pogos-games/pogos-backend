
export interface UnoPlayer {
  id: string; // socket ID
  name: string;
  hand: UnoCard[];
  isCurrentTurn: boolean;
}
