import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

/** Création toujours en DRAFT ; le statut ne change que via publish() ou cancel(). */
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dateTime: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @Min(1)
  capacity: number;
}
