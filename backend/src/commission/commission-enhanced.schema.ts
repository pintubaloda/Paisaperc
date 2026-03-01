import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class CommissionEnhanced extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ type: String, enum: UserRole, required: true })
  userType: UserRole; // Profile Name

  @Prop({ required: true })
  operatorId: string;

  @Prop({ required: true })
  service: string; // mobile, dth, bill_payment

  @Prop({ default: 0 })
  chargePercent: number; // Surcharge %

  @Prop({ default: 0 })
  chargeValue: number; // Surcharge ₹

  @Prop({ default: 0 })
  commissionPercent: number; // Commission %

  @Prop({ default: 0 })
  commissionValue: number; // Commission ₹

  @Prop({ default: 'false' })
  isSlab: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CommissionEnhancedSchema = SchemaFactory.createForClass(CommissionEnhanced);
