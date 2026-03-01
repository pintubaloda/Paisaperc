import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TxnEvent } from './txn-event.schema';

@Injectable()
export class TxnEventService {
  constructor(
    @InjectModel(TxnEvent.name) private eventModel: Model<TxnEvent>,
  ) {}

  async log(
    txnId: string,
    event: string,
    description: string,
    status?: string,
    meta?: Record<string, any>,
  ): Promise<void> {
    await new this.eventModel({ txnId, event, description, status, meta }).save();
  }

  async getTimeline(txnId: string): Promise<any[]> {
    return this.eventModel
      .find({ txnId })
      .sort({ createdAt: 1 })
      .select('-_id -__v')
      .lean();
  }
}
