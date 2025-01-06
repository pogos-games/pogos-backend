import { Injectable } from '@nestjs/common';
import { Card } from './model/card.interface';

@Injectable()
export class CardsService {

  private shuffleDeck(deck: Card[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  private getBlackjackRankValue(rank: string): number {
    if (['K', 'Q', 'J'].includes(rank)) {
      return 10;
    } else if (rank === 'A') {
      return 11;
    } else {
      return parseInt(rank);
    }
  }

  public createBlackjackDeck(): Card[] {
    const suits = ['H', 'D', 'C', 'S'];
    const ranks = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
      'A',
    ];
    const deck: Card[] = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit, value: this.getBlackjackRankValue(rank) });
      }
    }
    this.shuffleDeck(deck)
    return deck;
  }
}
