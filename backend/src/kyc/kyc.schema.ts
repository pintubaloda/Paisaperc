import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class KYCDocument extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  docType: string; // pan, aadhaar, gst

  @Prop({ required: true })
  docNumber: string;

  @Prop()
  docUrl: string;

  @Prop({ default: 'pending' })
  status: string; // pending, approved, rejected

  @Prop()
  verifiedBy: string;

  @Prop()
  verifiedAt: Date;

  @Prop()
  rejectionReason: string;
}

export const KYCDocumentSchema = SchemaFactory.createForClass(KYCDocument);
