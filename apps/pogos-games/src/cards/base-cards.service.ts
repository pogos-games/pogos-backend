import { Injectable } from '@nestjs/common';
import { BaseCard } from './model/card.interface';

@Injectable()
export abstract class BaseCardsService<TCard extends BaseCard> {

  public abstract createDeck(): TCard[];
}
