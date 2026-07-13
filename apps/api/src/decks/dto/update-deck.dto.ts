import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateDeckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
