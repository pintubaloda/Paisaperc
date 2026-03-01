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

class APIHeader {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

class OperatorCodeMapping {
  @Prop()
  operatorId: string;

  @Prop()
  providerCode: string;
}

class ResponseMapping {
  @Prop()
  keyMessage: string;

  @Prop()
  responseType: string;

  @Prop()
  errorCode: string;

  @Prop()
  status: string;
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

  @Prop({ type: [APIHeader], default: [] })
  headers: APIHeader[];

  @Prop()
  authToken: string;

  @Prop({ default: 'query_param' })
  requestFormat: string;

  @Prop({ type: [OperatorCodeMapping], default: [] })
  operatorCodes: OperatorCodeMapping[];

  @Prop({ type: [ResponseMapping], default: [] })
  responseMappings: ResponseMapping[];

  @Prop()
  successField: string;

  @Prop()
  successValue: string;

  @Prop()
  failedValue: string;

  @Prop()
  pendingValue: string;

  @Prop()
  txnIdField: string;

  @Prop()
  balanceField: string;

  @Prop()
  messageField: string;

  // Status Check API fields
  @Prop()
  statusCheckEndpoint: string;

  @Prop()
  statusCheckMethod: string;

  @Prop({ type: [APIParameter], default: [] })
  statusCheckParams: APIParameter[];

  @Prop({ default: false })
  isSandbox: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 100 })
  successRate: number;

  @Prop({ default: 0 })
  balance: number;

  @Prop()
  callbackToken: string;

  @Prop()
  sampleRequest: string;

  @Prop()
  sampleResponse: string;
}

export const APIMasterSchema = SchemaFactory.createForClass(APIMaster);
