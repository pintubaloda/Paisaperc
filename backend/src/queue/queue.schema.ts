import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class QueueJob extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  type: string; // recharge, status_check, reconciliation

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ default: 'pending' })
  status: string; // pending, processing, completed, failed

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: 3 })
  maxAttempts: number;

  @Prop()
  result: string;

  @Prop()
  error: string;

  @Prop()
  processedAt: Date;
}

export const QueueJobSchema = SchemaFactory.createForClass(QueueJob);
