import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dispute } from './dispute.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DisputeService {
  constructor(@InjectModel(Dispute.name) private disputeModel: Model<Dispute>) {}

  async create(data: Partial<Dispute>): Promise<any> {
    const dispute = new this.disputeModel({ ...data, id: uuidv4() });
    await dispute.save();
    const obj = dispute.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findAll(): Promise<any[]> {
    return this.disputeModel.find().sort({ createdAt: -1 }).select('-_id -__v');
  }

  async findUnresolved(): Promise<any[]> {
    return this.disputeModel.find({ resolved: false }).sort({ createdAt: -1 }).select('-_id -__v');
  }

  async resolve(id: string, adminAction: string, adminNote: string, resolvedBy: string): Promise<any> {
    const dispute = await this.disputeModel.findOneAndUpdate(
      { id },
      { resolved: true, adminAction, adminNote, resolvedBy, resolvedAt: new Date() },
      { new: true },
    ).select('-_id -__v');
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }
}
