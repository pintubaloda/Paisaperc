import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class OperatorAPIMapping extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  operatorId: string;

  @Prop({ required: true })
  apiId: string;

  @Prop({ default: 1 })
  priority: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  minAmount: number;

  @Prop({ default: 999999 })
  maxAmount: number;
}

export const OperatorAPIMappingSchema = SchemaFactory.createForClass(OperatorAPIMapping);
