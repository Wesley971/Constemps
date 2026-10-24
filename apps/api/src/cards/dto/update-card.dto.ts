import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { EXAMPLE_MESSAGE, EXAMPLE_PATTERN, normalizeExample } from './example';

const MAX_FIELD_LENGTH = 5000;

export class UpdateCardDto {
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

  // Phrase d'exemple (CON-77) : absente, l'exemple est gardé ; null ou vide l'efface.
  @Transform(({ value }: { value: unknown }) => normalizeExample(value))
  @IsOptional()
  @Matches(EXAMPLE_PATTERN, { message: EXAMPLE_MESSAGE })
  example?: string | null;
}
