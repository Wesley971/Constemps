import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CardType } from '@prisma/client';

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
}
