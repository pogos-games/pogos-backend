import { Injectable } from '@nestjs/common';
import { BaseCardsService } from '../cards/base-cards.service';
import { UnoCard, UnoCardColor, UnoCardType } from './entities/uno-card.interface';

@Injectable()
export class UnoCardsService extends BaseCardsService<UnoCard>{

  public override createDeck(): UnoCard[] {
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
    return deck
  }
}
