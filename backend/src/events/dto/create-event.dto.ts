import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsIn,
} from 'class-validator';

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

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'CANCELLED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
}
