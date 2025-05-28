
export interface UnoCard {
  color: UnoCardColor;
  type: UnoCardType;
  value?: number; // Only if type is Number
}

export enum UnoCardType {
  Number = 'NUMBER',
  Skip = 'SKIP',
  Reverse = 'REVERSE',
  DrawTwo = 'DRAW_TWO',
  Wild = 'WILD',
  WildDrawFour = 'WILD_DRAW_FOUR',
}


export enum UnoCardColor {
  Red = 'RED',
  Yellow = 'YELLOW',
  Green = 'GREEN',
  Blue = 'BLUE',
  Wild = 'WILD',
}
