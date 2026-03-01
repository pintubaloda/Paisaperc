import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole, CommissionType, ServiceType } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Commission extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ required: true })
  operatorId: string;

  @Prop({ type: String, enum: ServiceType })
  service: ServiceType;

  @Prop({ type: String, enum: CommissionType, required: true })
  commissionType: CommissionType;

  @Prop({ required: true })
  commissionValue: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);
