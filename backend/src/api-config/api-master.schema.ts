import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ServiceType, APIMethod } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

class APIParameter {
  @Prop({ required: true })
  fieldName: string;

  @Prop({ required: true })
  fieldValue: string;

  @Prop({ default: false })
  isDynamic: boolean;
}

@Schema({ timestamps: true })
export class APIMaster extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ServiceType, required: true })
  apiType: ServiceType;

  @Prop({ default: 'https' })
  protocol: string;

  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ type: String, enum: APIMethod, required: true })
  method: APIMethod;

  @Prop({ type: [APIParameter], default: [] })
  parameters: APIParameter[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 100 })
  successRate: number;

  @Prop({ default: 0 })
  balance: number;
}

export const APIMasterSchema = SchemaFactory.createForClass(APIMaster);
