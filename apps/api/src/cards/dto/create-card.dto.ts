import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CardType } from '@prisma/client';
import { EXAMPLE_MESSAGE, EXAMPLE_PATTERN, normalizeExample } from './example';

const MAX_FIELD_LENGTH = 5000;

export class CreateCardDto {
  @IsEnum(CardType)
  type: CardType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH, {
    message: `Le recto ne doit pas dépasser ${MAX_FIELD_LENGTH} caractères`,
  })
  front: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH, {
    message: `Le verso ne doit pas dépasser ${MAX_FIELD_LENGTH} caractères`,
  })
  back: string;

  // Phrase d'exemple facultative (CON-77) : absente, null ou vide, pas d'exemple.
  @Transform(({ value }: { value: unknown }) => normalizeExample(value))
  @IsOptional()
  @Matches(EXAMPLE_PATTERN, { message: EXAMPLE_MESSAGE })
  example?: string | null;
}
