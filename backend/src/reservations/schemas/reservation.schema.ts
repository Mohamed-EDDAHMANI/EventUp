import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Reservation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: ReservationStatus;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Un seul réservation active (PENDING ou CONFIRMED) par événement et utilisateur.
// Les réservations annulées (CANCELLED) n'entrent pas dans l'index, donc l'utilisateur peut réserver à nouveau après annulation.
ReservationSchema.index(
  { event: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } },
  },
);
