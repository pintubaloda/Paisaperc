import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Dispute extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  txnId: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  operatorName: string;

  @Prop()
  mobile: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  originalStatus: string;

  @Prop({ required: true })
  webhookStatus: string;

  @Prop({ type: Object })
  webhookData: Record<string, any>;

  @Prop({ default: false })
  resolved: boolean;

  @Prop()
  adminAction: string;

  @Prop()
  adminNote: string;

  @Prop()
  resolvedBy: string;

  @Prop()
  resolvedAt: Date;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);
