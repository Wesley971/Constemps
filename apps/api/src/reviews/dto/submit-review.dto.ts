import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
  userAnswer?: string;
}
