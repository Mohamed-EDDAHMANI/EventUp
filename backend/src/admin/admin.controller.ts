import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventsService } from '../events/events.service';
import { ReservationsService } from '../reservations/reservations.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Get()
  getAdmin() {
    return { message: 'Admin dashboard', ok: true };
  }

  @Get('stats')
  async getStats() {
    const [upcomingEvents, reservationsByStatus] = await Promise.all([
      this.eventsService.findPublished(),
      this.reservationsService.countByStatus(),
    ]);

    const totalCapacity = upcomingEvents.reduce((sum, e) => sum + (e.capacity ?? 0), 0);
    const totalReserved = upcomingEvents.reduce(
      (sum, e) => sum + (e.reservedCount ?? 0),
      0,
    );
    const fillRate =
      totalCapacity > 0 ? Math.round((totalReserved / totalCapacity) * 100) : 0;

    return {
      upcomingEventsCount: upcomingEvents.length,
      fillRatePercent: fillRate,
      totalCapacity,
      totalReserved,
      reservationsByStatus,
    };
  }
}
