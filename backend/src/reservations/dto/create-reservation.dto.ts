import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateReservationDto {
  @IsMongoId({ message: "L'identifiant de l'événement est invalide" })
  @IsNotEmpty({ message: "L'événement est requis" })
  eventId: string;
}
