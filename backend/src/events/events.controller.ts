import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { ReservationsService } from '../reservations/reservations.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.eventsService.findPublished();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAllAdmin() {
    return this.eventsService.findAll();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminStats() {
    const [upcomingEvents, reservationsByStatus] = await Promise.all([
      this.eventsService.findPublished(),
      this.reservationsService.countByStatus(),
    ]);
    const totalCapacity = upcomingEvents.reduce(
      (sum, e) => sum + (e.capacity ?? 0),
      0,
    );
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

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);
    const remainingPlaces = this.eventsService.remainingPlaces(event);
    const obj = event.toObject() as Record<string, unknown>;
    return { ...obj, remainingPlaces };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  publish(@Param('id') id: string) {
    return this.eventsService.publish(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  cancel(@Param('id') id: string) {
    return this.eventsService.cancel(id);
  }
}
