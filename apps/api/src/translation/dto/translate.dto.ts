import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_TEXT_LENGTH = 5000;

export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_TEXT_LENGTH, {
    message: `Le texte ne doit pas dépasser ${MAX_TEXT_LENGTH} caractères`,
  })
  text: string;

  @IsString()
  @IsNotEmpty()
  targetLang: string;
}
