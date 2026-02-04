import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { EventsModule } from '../events/events.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [EventsModule, ReservationsModule],
  controllers: [AdminController],
})
export class AdminModule {}
