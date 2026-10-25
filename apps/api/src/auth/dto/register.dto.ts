import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  FIRST_NAME_MESSAGE,
  FIRST_NAME_PATTERN,
  normalizeFirstName,
} from './first-name';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  // Facultatif (CON-56) : absent, null ou vide, le compte est créé sans prénom.
  @Transform(({ value }: { value: unknown }) => normalizeFirstName(value))
  @IsOptional()
  @Matches(FIRST_NAME_PATTERN, { message: FIRST_NAME_MESSAGE })
  firstName?: string | null;
}
