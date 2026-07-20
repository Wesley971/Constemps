import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const MAX_USER_ANSWER_LENGTH = 5000;

export enum ManualRating {
  AGAIN = 'AGAIN',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export class SubmitReviewDto {
  @IsUUID('4')
  cardId: string;

  @IsOptional()
  @IsEnum(ManualRating)
  rating?: ManualRating;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_USER_ANSWER_LENGTH, {
    message: `La réponse ne doit pas dépasser ${MAX_USER_ANSWER_LENGTH} caractères`,
  })
  userAnswer?: string;
}
