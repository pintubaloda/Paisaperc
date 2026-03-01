import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

class OperatorCodeMapping {
  @Prop({ required: true })
  operatorId: string;

  @Prop({ required: true })
  providerCode: string;

  @Prop()
  optional1: string;

  @Prop()
  optional2: string;

  @Prop()
  optional3: string;
}

class ResponseMapping {
  @Prop({ required: true })
  keyMessage: string;

  @Prop({ required: true })
  responseType: string; // SUCCESS, FAILED, PENDING

  @Prop()
  errorCode: string;

  @Prop()
  status: string; // Internal status value from provider

  @Prop()
  txnIdStart: string; // JSON path like "orderId"

  @Prop()
  txnIdEnd: string;

  @Prop()
  opidStart: string; // Operator reference

  @Prop()
  opidEnd: string;

  @Prop()
  balanceStart: string;

  @Prop()
  balanceEnd: string;

  @Prop({ default: false })
  alertEnabled: boolean;

  @Prop()
  alertType: string; // whatsapp, sms, email
}

@Schema({ timestamps: true })
export class APIConfiguration extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  apiType: string;

  @Prop({ default: 'https' })
  protocol: string;

  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  method: string;

  @Prop({ type: Array, default: [] })
  parameters: any[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 100 })
  successRate: number;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ type: String, default: () => `CB${Date.now()}${Math.random().toString(36).substr(2, 9)}` })
  callbackToken: string;

  @Prop({ type: [OperatorCodeMapping], default: [] })
  operatorCodes: OperatorCodeMapping[];

  @Prop({ type: [ResponseMapping], default: [] })
  responseMappings: ResponseMapping[];

  @Prop()
  sampleRequest: string;

  @Prop()
  sampleResponse: string;

  @Prop({ default: 5 })
  lowBalanceThreshold: number;

  @Prop({ default: 'whatsapp' })
  lowBalanceAlertType: string;
}

export const APIConfigurationSchema = SchemaFactory.createForClass(APIConfiguration);
