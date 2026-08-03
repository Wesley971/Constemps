import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_TEXT_LENGTH = 5000;
const SUPPORTED_TARGET_LANGS = ['FR', 'EN'] as const;

export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_TEXT_LENGTH, {
    message: `Le texte ne doit pas dépasser ${MAX_TEXT_LENGTH} caractères`,
  })
  text: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @IsIn(SUPPORTED_TARGET_LANGS, {
    message: `targetLang doit être l'une des valeurs suivantes : ${SUPPORTED_TARGET_LANGS.join(', ')}`,
  })
  targetLang: string;
}
