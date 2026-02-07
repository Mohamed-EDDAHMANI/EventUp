import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationStatus } from './schemas/reservation.schema';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { EventsService } from '../events/events.service';
import { Event } from '../events/schemas/event.schema';
import { PdfTicketService } from './pdf-ticket.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    private readonly eventsService: EventsService,
    private readonly pdfTicketService: PdfTicketService,
  ) {}

  /**
   * Crée une réservation avec les règles de gestion :
   * - Vérification capacité : l'événement doit avoir au moins une place (atomique en concurrence).
   * - Pas de doublon : un seul réservation PENDING ou CONFIRMED par (événement, utilisateur).
   * - Événement publié et à venir.
   */
  async create(eventId: string, userId: string): Promise<Reservation> {
    const event = (await this.eventsService.findOne(eventId)) as Event & {
      reservedCount?: number;
    };
    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Seuls les événements publiés peuvent être réservés',
      );
    }
    if (new Date(event.dateTime) < new Date()) {
      throw new BadRequestException("L'événement est déjà passé");
    }
    // Doublon : une seule réservation active (PENDING ou CONFIRMED) par utilisateur et événement
    const existing = await this.reservationModel
      .findOne({
        event: eventId,
        user: userId,
        status: { $in: ['PENDING', 'CONFIRMED'] as ReservationStatus[] },
      })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'Vous avez déjà une réservation pour cet événement',
      );
    }
    // Vérification capacité de manière atomique (évite surréservation en concurrence)
    const placeReserved =
      await this.eventsService.reservePlaceIfCapacity(eventId);
    if (!placeReserved) {
      throw new BadRequestException('Plus de places disponibles');
    }
    try {
      const reservation = new this.reservationModel({
        event: eventId,
        user: userId,
        status: 'PENDING' as ReservationStatus,
      });
      return await reservation.save();
    } catch (err) {
      await this.eventsService.decrementReservedCount(eventId);
      throw err;
    }
  }

  /**
   * Admin : crée une réservation pour un participant (mêmes règles de gestion que create).
   */
  async createForParticipant(
    eventId: string,
    userId: string,
  ): Promise<Reservation> {
    return this.create(eventId, userId);
  }

  async confirm(id: string, userId: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    if (reservation.user.toString() !== userId) {
      throw new ForbiddenException('Cette réservation ne vous appartient pas');
    }
    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Seule une réservation en attente peut être confirmée',
      );
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        id,
        {
          $set: { status: 'CONFIRMED' as ReservationStatus },
          $currentDate: { updatedAt: true },
        },
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
      throw new ForbiddenException('Cette réservation ne vous appartient pas');
    }
    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        id,
        {
          $set: { status: 'CANCELLED' as ReservationStatus },
          $currentDate: { updatedAt: true },
        },
        { new: true },
      )
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    await this.eventsService.decrementReservedCount(
      reservation.event.toString(),
    );
    return updated;
  }

  async findOne(id: string, userId?: string): Promise<Reservation> {
    const raw = await this.reservationModel.findById(id).exec();
    if (!raw) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    if (userId && raw.user.toString() !== userId) {
      throw new ForbiddenException('Cette réservation ne vous appartient pas');
    }
    const reservation = await this.reservationModel
      .findById(id)
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    return reservation!;
  }

  /**
   * Génère le PDF billet. Route sécurisée :
   * - Réservation doit exister
   * - L'utilisateur doit être le propriétaire de la réservation (403 sinon)
   * - Le statut doit être CONFIRMED (400 sinon) : pas de téléchargement pour PENDING ou CANCELLED
   * @returns buffer et titre de l'événement (pour le nom du fichier)
   */
  async getTicketPdf(
    id: string,
    userId: string,
  ): Promise<{ buffer: Buffer; eventTitle: string }> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('event', 'title dateTime location')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    const ownerId =
      typeof reservation.user === 'object' &&
      reservation.user &&
      '_id' in reservation.user
        ? String((reservation.user as { _id: unknown })._id)
        : String(reservation.user);
    if (ownerId !== userId) {
      throw new ForbiddenException('Cette réservation ne vous appartient pas');
    }
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        "Le billet PDF est disponible uniquement pour les réservations confirmées par l'administrateur.",
      );
    }
    const event = reservation.event as unknown as {
      title: string;
      dateTime: Date;
      location: string;
    };
    const user = reservation.user as unknown as {
      email: string;
      firstName: string;
      lastName: string;
    };
    const eventDate = event?.dateTime
      ? new Date(event.dateTime).toLocaleString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '–';
    const participantName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email ||
      '–';
    const confirmedAt = reservation.updatedAt
      ? new Date(reservation.updatedAt).toLocaleDateString('fr-FR')
      : undefined;
    const eventTitle = event?.title ?? 'Événement';
    const buffer = await this.pdfTicketService.generateTicket({
      eventTitle,
      eventDateTime: eventDate,
      eventLocation: event?.location ?? '–',
      participantName,
      participantEmail: user?.email ?? '–',
      reservationId: id,
      confirmedAt,
    });
    return { buffer, eventTitle };
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    return this.reservationModel
      .find({ user: userId })
      .populate(
        'event',
        'title dateTime location status capacity reservedCount',
      )
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
        {
          $set: { status: 'CONFIRMED' as ReservationStatus },
          $currentDate: { updatedAt: true },
        },
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
  async countByStatus(): Promise<{
    PENDING: number;
    CONFIRMED: number;
    CANCELLED: number;
  }> {
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
        {
          $set: { status: 'CANCELLED' as ReservationStatus },
          $currentDate: { updatedAt: true },
        },
        { new: true },
      )
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    await this.eventsService.decrementReservedCount(
      reservation.event.toString(),
    );
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
      throw new ForbiddenException('Cette réservation ne vous appartient pas');
    }
    if (
      updateReservationDto.status === 'CONFIRMED' &&
      reservation.status === 'PENDING'
    ) {
      return this.confirm(id, userId);
    }
    if (updateReservationDto.status === 'CANCELLED') {
      return this.cancel(id, userId);
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        id,
        { $set: updateReservationDto, $currentDate: { updatedAt: true } },
        { new: true },
      )
      .populate('event', 'title dateTime location status')
      .populate('user', 'email firstName lastName')
      .exec();
    if (!updated) throw new NotFoundException(`Réservation #${id} introuvable`);
    return updated;
  }
}
