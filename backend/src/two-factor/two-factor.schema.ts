import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class TwoFactorAuth extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ default: false })
  isEnabled: boolean;

  @Prop()
  secret: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: [String], default: [] })
  backupCodes: string[];
}

export const TwoFactorAuthSchema = SchemaFactory.createForClass(TwoFactorAuth);
