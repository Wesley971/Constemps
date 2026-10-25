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

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;

  // null (ou chaîne vide) : efface le prénom.
  @Transform(({ value }: { value: unknown }) => normalizeFirstName(value))
  @IsOptional()
  @Matches(FIRST_NAME_PATTERN, { message: FIRST_NAME_MESSAGE })
  firstName?: string | null;
}
