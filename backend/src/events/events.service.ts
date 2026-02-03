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

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = new this.eventModel({
      ...createEventDto,
      dateTime: new Date(createEventDto.dateTime),
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
    if (updateEventDto.dateTime) {
      (updateEventDto as { dateTime?: Date }).dateTime = new Date(
        updateEventDto.dateTime,
      );
    }
    const updated = await this.eventModel
      .findByIdAndUpdate(id, { $set: updateEventDto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Événement #${id} introuvable`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Événement #${id} introuvable`);
    }
  }

  async publish(id: string): Promise<Event> {
    const event = await this.findOne(id);
    if (event.status === 'PUBLISHED') {
      throw new BadRequestException('Cet événement est déjà publié');
    }
    if (event.status === 'CANCELLED') {
      throw new BadRequestException(
        'Impossible de publier un événement annulé',
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
    if (event.status === 'CANCELLED') {
      throw new BadRequestException('Cet événement est déjà annulé');
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
}
