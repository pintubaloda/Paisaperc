import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class TxnEvent extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true, index: true })
  txnId: string;

  @Prop({ required: true })
  event: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  status: string;

  @Prop({ type: Object })
  meta: Record<string, any>;
}

export const TxnEventSchema = SchemaFactory.createForClass(TxnEvent);
