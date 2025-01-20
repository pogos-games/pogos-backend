import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageMeta } from './page-meta.interface';

export class Page<T> {
  @IsArray()
  @ApiProperty({ isArray: true })
  readonly data: T[];

  @ApiProperty({ type: () => PageMeta })
  readonly meta: PageMeta;

  constructor(data: T[], meta: PageMeta) {
    this.data = data;
    this.meta = meta;
  }
}