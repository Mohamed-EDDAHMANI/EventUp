import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type Role = 'ADMIN' | 'PARTICIPANT';

@Schema({ timestamps: { createdAt: 'createdAt' } })
export class User extends Document {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: ['ADMIN', 'PARTICIPANT'], default: 'PARTICIPANT' })
  role: Role;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
