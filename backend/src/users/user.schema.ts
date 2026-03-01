import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  mobile: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ default: false })
  kycStatus: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  panCard: string;

  @Prop()
  aadhaarCard: string;

  @Prop()
  gstNumber: string;

  @Prop()
  kycVerifiedBy: string;

  @Prop()
  kycVerifiedAt: Date;

  @Prop()
  kycRejectionReason: string;

  @Prop({ default: 'pending' })
  kycVerificationStatus: string;

  @Prop()
  panDocUrl: string;

  @Prop()
  aadhaarDocUrl: string;

  @Prop()
  gstDocUrl: string;

  @Prop()
  apiKey: string;

  @Prop({ type: [String], default: [] })
  allowedIps: string[];

  @Prop()
  apiSecret: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
