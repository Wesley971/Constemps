import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CardType } from '@prisma/client';

export class CreateCardDto {
  @IsEnum(CardType)
  type: CardType;

  @IsString()
  @IsNotEmpty()
  front: string;

  @IsString()
  @IsNotEmpty()
  back: string;
}
