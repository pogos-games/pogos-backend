

export interface UnoCard {
  color: UnoColor;
  type: UnoType;
  value?: number; // Présent uniquement si type === Number
}
