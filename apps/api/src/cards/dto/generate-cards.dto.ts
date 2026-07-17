import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const MAX_GENERATE_TEXT_LENGTH = 50000;

export class GenerateCardsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_GENERATE_TEXT_LENGTH, {
    message: `Le texte ne doit pas dépasser ${MAX_GENERATE_TEXT_LENGTH} caractères`,
  })
  text: string;
}
