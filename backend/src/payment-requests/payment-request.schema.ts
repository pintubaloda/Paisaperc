import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PaymentRequestStatus } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class PaymentRequest extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  paymentMode: string;

  @Prop({ required: true })
  referenceNumber: string;

  @Prop()
  proofUrl: string;

  @Prop({ type: String, enum: PaymentRequestStatus, default: PaymentRequestStatus.PENDING })
  status: PaymentRequestStatus;

  @Prop()
  adminRemarks: string;

  @Prop()
  remarks: string;
}

export const PaymentRequestSchema = SchemaFactory.createForClass(PaymentRequest);
