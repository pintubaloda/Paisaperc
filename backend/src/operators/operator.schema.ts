import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ServiceType } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Operator extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ServiceType, required: true })
  service: ServiceType;

  @Prop({ required: true })
  opCode: string;

  @Prop()
  stateCode: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const OperatorSchema = SchemaFactory.createForClass(Operator);
