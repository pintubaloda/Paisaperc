import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransactionStatus } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class RechargeTransaction extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  operatorId: string;

  @Prop()
  operatorName: string;

  @Prop()
  apiId: string;

  @Prop({ required: true })
  mobile: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 0 })
  commission: number;

  @Prop({ default: 0 })
  refundAmount: number;

  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.INIT })
  status: TransactionStatus;

  @Prop()
  providerRef: string;

  @Prop()
  responseCode: string;

  @Prop()
  responseMessage: string;

  @Prop()
  circle: string;

  @Prop({ default: false })
  isSandbox: boolean;
}

export const RechargeTransactionSchema = SchemaFactory.createForClass(RechargeTransaction);
