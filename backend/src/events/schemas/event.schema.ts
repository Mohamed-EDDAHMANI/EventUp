import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

@Schema({ timestamps: { createdAt: 'createdAt' } })
export class Event extends Document {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Date, required: true })
  dateTime: Date;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: Number, required: true, min: 1 })
  capacity: number;

  @Prop({
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
    default: 'DRAFT',
  })
  status: EventStatus;

  @Prop({ type: Number, default: 0 })
  reservedCount: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
