import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsNotEmpty()
  front: string;

  @IsString()
  @IsNotEmpty()
  back: string;
}
