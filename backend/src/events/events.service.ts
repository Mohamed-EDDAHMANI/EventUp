import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

/**
 * Logique des statuts Event :
 * - DRAFT   : brouillon, modifiable ; visible uniquement par l'admin.
 * - PUBLISHED : publié, visible par tous ; modifiable (date/lieu/capacity) ; peut être annulé.
 * - CANCELLED : annulé, terminal ; plus modifiable ni publiable.
 *
 * Transitions autorisées :
 *   DRAFT → PUBLISHED (publish)
 *   DRAFT → CANCELLED (cancel)
 *   PUBLISHED → CANCELLED (cancel)
 */
const ALLOWED_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[] | null> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['CANCELLED'],
  CANCELLED: null, // terminal
};

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = new this.eventModel({
      ...createEventDto,
      dateTime: new Date(createEventDto.dateTime),
      status: 'DRAFT' as EventStatus,
    });
    return event.save();
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel.find().sort({ dateTime: 1 }).exec();
  }

  async findPublished(): Promise<Event[]> {
    return this.eventModel
      .find({ status: 'PUBLISHED', dateTime: { $gte: new Date() } })
      .sort({ dateTime: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Événement #${id} introuvable`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    if (event.status === 'CANCELLED') {
      throw new BadRequestException(
        'Impossible de modifier un événement annulé',
      );
    }
    const { status: _status, ...payload } = updateEventDto as UpdateEventDto & {
      status?: EventStatus;
    };
    void _status;
    if (payload.dateTime) {
      (payload as { dateTime?: Date }).dateTime = new Date(payload.dateTime);
    }
    const updated = await this.eventModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Événement #${id} introuvable`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    if (event.status !== 'DRAFT') {
      throw new BadRequestException(
        'Suppression autorisée uniquement pour un événement en brouillon. Utilisez "annuler" pour un événement publié.',
      );
    }
    const result = await this.eventModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Événement #${id} introuvable`);
    }
  }

  async publish(id: string): Promise<Event> {
    const event = await this.findOne(id);
    const allowed = ALLOWED_STATUS_TRANSITIONS[event.status];
    if (!allowed?.includes('PUBLISHED')) {
      throw new BadRequestException(
        event.status === 'PUBLISHED'
          ? 'Cet événement est déjà publié'
          : 'Impossible de publier un événement annulé',
      );
    }
    const updated = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'PUBLISHED' as EventStatus } },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`Événement #${id} introuvable`);
    }
    return updated;
  }

  async cancel(id: string): Promise<Event> {
    const event = await this.findOne(id);
    const allowed = ALLOWED_STATUS_TRANSITIONS[event.status];
    if (!allowed?.includes('CANCELLED')) {
      throw new BadRequestException(
        event.status === 'CANCELLED'
          ? 'Cet événement est déjà annulé'
          : "Impossible d'annuler cet événement",
      );
    }
    const updated = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'CANCELLED' as EventStatus } },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`Événement #${id} introuvable`);
    }
    return updated;
  }

  remainingPlaces(event: Event): number {
    return Math.max(0, event.capacity - (event.reservedCount ?? 0));
  }

  /**
   * Incrémente reservedCount de 1. Lance une erreur si l'événement n'existe pas.
   */
  async incrementReservedCount(eventId: string): Promise<void> {
    const result = await this.eventModel
      .findByIdAndUpdate(eventId, { $inc: { reservedCount: 1 } }, { new: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Événement #${eventId} introuvable`);
    }
  }

  /**
   * Réserve une place de manière atomique : n'incrémente que si reservedCount < capacity.
   * Évite la surréservation en cas de requêtes concurrentes.
   * @returns true si une place a été réservée, false si capacité atteinte
   */
  async reservePlaceIfCapacity(eventId: string): Promise<boolean> {
    const result = await this.eventModel
      .findOneAndUpdate(
        {
          _id: eventId,
          $expr: { $lt: [{ $ifNull: ['$reservedCount', 0] }, '$capacity'] },
        },
        { $inc: { reservedCount: 1 } },
        { new: true },
      )
      .exec();
    return result != null;
  }

  async decrementReservedCount(eventId: string): Promise<void> {
    const event = await this.findOne(eventId);
    const current = event.reservedCount ?? 0;
    if (current <= 0) return;
    const result = await this.eventModel
      .findByIdAndUpdate(eventId, { $inc: { reservedCount: -1 } }, { new: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Événement #${eventId} introuvable`);
    }
  }
}
