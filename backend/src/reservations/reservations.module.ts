import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PdfTicketService } from './pdf-ticket.service';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    forwardRef(() => EventsModule),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, PdfTicketService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
