import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
