import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const MAX_TEXT_LENGTH = 5000;

export class TranslateDto {
  // Trim avant validation : un texte composé uniquement d'espaces doit être
  // rejeté par IsNotEmpty plutôt que partir chez Gemini.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_TEXT_LENGTH, {
    message: `Le texte ne doit pas dépasser ${MAX_TEXT_LENGTH} caractères`,
  })
  text: string;

  // Absent : la langue source est détectée automatiquement. Présent : bouton
  // "Inverser" du front, qui impose le verdict "ce texte est-il du français ?"
  // opposé à celui de l'appel précédent. La langue cible reste toujours
  // déterminée côté back (voir TranslationService).
  @IsOptional()
  @IsBoolean()
  forceSourceIsFrench?: boolean;
}
