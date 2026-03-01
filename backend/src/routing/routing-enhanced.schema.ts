import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class RoutingRuleEnhanced extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  id: string;

  @Prop() // "all" or specific userId
  userId: string;

  @Prop({ required: true })
  operatorId: string;

  @Prop({ type: [String], required: true })
  apiIds: string[]; // [API1, API2, API3] in priority order

  @Prop({ default: true })
  isActive: boolean;
}

export const RoutingRuleEnhancedSchema = SchemaFactory.createForClass(RoutingRuleEnhanced);
