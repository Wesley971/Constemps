import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
}
