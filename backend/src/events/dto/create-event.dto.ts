import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { IsFutureDate } from '../validators/is-future-date.validator';

/** Création toujours en DRAFT ; le statut ne change que via publish() ou cancel(). */
export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est requis' })
  @MaxLength(200, { message: 'Le titre ne doit pas dépasser 200 caractères' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La description ne doit pas dépasser 2000 caractères',
  })
  description?: string;

  @IsDateString(
    {},
    {
      message:
        'dateTime doit être une date ISO 8601 valide (ex: 2025-12-31T19:00:00.000Z)',
    },
  )
  @IsFutureDate({ message: "La date de l'événement doit être dans le futur" })
  dateTime: string;

  @IsString()
  @IsNotEmpty({ message: 'Le lieu est requis' })
  @MaxLength(500, { message: 'Le lieu ne doit pas dépasser 500 caractères' })
  location: string;

  @IsInt({ message: 'La capacité doit être un nombre entier' })
  @Min(1, { message: 'La capacité doit être au moins 1' })
  @Max(100_000, { message: 'La capacité ne doit pas dépasser 100 000' })
  capacity: number;
}
