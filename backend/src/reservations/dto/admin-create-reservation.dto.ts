import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AdminCreateReservationDto {
  @IsMongoId({ message: "L'identifiant de l'événement est invalide" })
  @IsNotEmpty({ message: "L'événement est requis" })
  eventId: string;

  @IsMongoId({ message: "L'identifiant du participant est invalide" })
  @IsNotEmpty({ message: 'Le participant est requis' })
  userId: string;
}
