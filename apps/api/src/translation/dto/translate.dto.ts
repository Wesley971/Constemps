import { IsNotEmpty, IsString } from 'class-validator';

export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  targetLang: string;
}
