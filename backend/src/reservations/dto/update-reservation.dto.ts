import { IsEnum, IsOptional } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED'], {
    message: 'Le statut doit être PENDING, CONFIRMED ou CANCELLED',
  })
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}
