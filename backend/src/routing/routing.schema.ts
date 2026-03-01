import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class RoutingRule extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop({ type: String, enum: UserRole })
  role: UserRole;

  @Prop()
  operatorId: string;

  @Prop({ type: [String], default: [] })
  apiPriority: string[];

  @Prop({ default: 0 })
  minAmount: number;

  @Prop({ default: 999999 })
  maxAmount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const RoutingRuleSchema = SchemaFactory.createForClass(RoutingRule);
