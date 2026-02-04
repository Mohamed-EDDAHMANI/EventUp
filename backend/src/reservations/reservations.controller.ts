import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AdminCreateReservationDto } from './dto/admin-create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: CurrentUserPayload) {
    return this.reservationsService.create(dto.eventId, user.userId);
  }

  @Get('me')
  findMyReservations(@CurrentUser() user: CurrentUserPayload) {
    return this.reservationsService.findByUser(user.userId);
  }

  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  adminCreate(@Body() dto: AdminCreateReservationDto) {
    return this.reservationsService.createForParticipant(dto.eventId, dto.userId);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAllAdmin() {
    return this.reservationsService.findAll();
  }

  @Get('admin/by-event/:eventId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findByEventAdmin(@Param('eventId') eventId: string) {
    return this.reservationsService.findByEvent(eventId);
  }

  @Get('admin/by-participant/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findByParticipantAdmin(@Param('userId') userId: string) {
    return this.reservationsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reservationsService.findOne(id, user.userId);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reservationsService.confirm(id, user.userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reservationsService.cancel(id, user.userId);
  }

  @Post(':id/admin/confirm')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  adminConfirm(@Param('id') id: string) {
    return this.reservationsService.adminConfirm(id);
  }

  @Post(':id/admin/refuse')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  adminRefuse(@Param('id') id: string) {
    return this.reservationsService.adminRefuse(id);
  }

  @Post(':id/admin/cancel')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  adminCancel(@Param('id') id: string) {
    return this.reservationsService.adminCancel(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reservationsService.update(id, updateReservationDto, user.userId);
  }
}
