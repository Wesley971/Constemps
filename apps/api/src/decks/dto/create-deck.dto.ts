import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DECK_COLORS } from '../deck-colors';
import type { DeckColor } from '../deck-colors';
import { DECK_ICONS } from '../deck-icons';
import type { DeckIcon } from '../deck-icons';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsIn(DECK_COLORS)
  color?: DeckColor | null;

  @IsOptional()
  @IsIn(DECK_ICONS)
  icon?: DeckIcon | null;
}
