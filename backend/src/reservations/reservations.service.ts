import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationStatus } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { EventsService } from '../events/events.service';
import { Event } from '../events/schemas/event.schema';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    private readonly eventsService: EventsService,
  ) {}

  async create(eventId: string, userId: string): Promise<Reservation> {
    const event = await this.eventsService.findOne(eventId) as Event & { reservedCount?: number };
    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException(
        "Seuls les événements publiés peuvent être réservés",
      );
    }
    if (new Date(event.dateTime) < new Date()) {
      throw new BadRequestException("L'événement est déjà passé");
    }
    const remaining = this.eventsService.remainingPlaces(event);
    if (remaining <= 0) {
      throw new BadRequestException("Plus de places disponibles");
    }
    const existing = await this.reservationModel
      .findOne({
        event: eventId,
        user: userId,
        status: { $in: ['PENDING', 'CONFIRMED'] as ReservationStatus[] },
      })
      .exec();
    if (existing) {
      throw new BadRequestException(
        "Vous avez déjà une réservation pour cet événement",
      );
    }
    const reservation = new this.reservationModel({
      event: eventId,
      user: userId,
      status: 'PENDING' as ReservationStatus,
    });
    const saved = await reservation.save();
    await this.eventsService.incrementReservedCount(eventId);
    return saved;
  }

  async confirm(id: string, userId: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    if (reservation.user.toString() !== userId) {
      throw new ForbiddenException("Cette réservation ne vous appartient pas");
    }
    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        "Seule une réservation en attente peut être confirmée",
      );
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'CONFIRMED' as ReservationStatus }, $currentDate: { updatedAt: true } },
        { new: true },
      )
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    return updated;
  }

  async cancel(id: string, userId: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    if (reservation.user.toString() !== userId) {
      throw new ForbiddenException("Cette réservation ne vous appartient pas");
    }
    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException("Cette réservation est déjà annulée");
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'CANCELLED' as ReservationStatus }, $currentDate: { updatedAt: true } },
        { new: true },
      )
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    await this.eventsService.decrementReservedCount(reservation.event.toString());
    return updated;
  }

  async findOne(id: string, userId?: string): Promise<Reservation> {
    const raw = await this.reservationModel.findById(id).exec();
    if (!raw) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    if (userId && raw.user.toString() !== userId) {
      throw new ForbiddenException("Cette réservation ne vous appartient pas");
    }
    const reservation = await this.reservationModel
      .findById(id)
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    return reservation!;
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    return this.reservationModel
      .find({ user: userId })
      .populate('event', 'title dateTime location status capacity')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByEvent(eventId: string): Promise<Reservation[]> {
    return this.reservationModel
      .find({ event: eventId })
      .populate('user', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Admin: list all reservations. */
  async findAll(): Promise<Reservation[]> {
    return this.reservationModel
      .find()
      .populate('event', 'title dateTime location status capacity')
      .populate('user', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Admin: confirm a reservation (PENDING → CONFIRMED). */
  async adminConfirm(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Seule une réservation en attente peut être confirmée',
      );
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'CONFIRMED' as ReservationStatus }, $currentDate: { updatedAt: true } },
        { new: true },
      )
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    return updated;
  }

  /** Admin: refuse a reservation (PENDING → CANCELLED, frees the place). */
  async adminRefuse(id: string): Promise<Reservation> {
    return this.adminCancel(id);
  }

  /** Admin: count reservations by status. */
  async countByStatus(): Promise<{ PENDING: number; CONFIRMED: number; CANCELLED: number }> {
    const [pending, confirmed, cancelled] = await Promise.all([
      this.reservationModel.countDocuments({ status: 'PENDING' }).exec(),
      this.reservationModel.countDocuments({ status: 'CONFIRMED' }).exec(),
      this.reservationModel.countDocuments({ status: 'CANCELLED' }).exec(),
    ]);
    return { PENDING: pending, CONFIRMED: confirmed, CANCELLED: cancelled };
  }

  /** Admin: cancel any reservation (frees the place). */
  async adminCancel(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'CANCELLED' as ReservationStatus }, $currentDate: { updatedAt: true } },
        { new: true },
      )
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    await this.eventsService.decrementReservedCount(reservation.event.toString());
    return updated;
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
    userId: string,
  ): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    if (reservation.user.toString() !== userId) {
      throw new ForbiddenException("Cette réservation ne vous appartient pas");
    }
    if (updateReservationDto.status === 'CONFIRMED' && reservation.status === 'PENDING') {
      return this.confirm(id, userId);
    }
    if (updateReservationDto.status === 'CANCELLED') {
      return this.cancel(id, userId);
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(id, { $set: updateReservationDto, $currentDate: { updatedAt: true } }, { new: true })
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    return updated;
  }
}
