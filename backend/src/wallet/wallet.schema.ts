import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  lockedBalance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

@Schema({ timestamps: true })
export class LedgerEntry extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  txnId: string;

  @Prop({ default: 0 })
  debit: number;

  @Prop({ default: 0 })
  credit: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  remark: string;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
