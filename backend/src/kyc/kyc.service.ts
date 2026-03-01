import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KYCDocument } from './kyc.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KycService {
  constructor(@InjectModel(KYCDocument.name) private kycModel: Model<KYCDocument>) {}

  async submitDocument(userId: string, data: { docType: string; docNumber: string; docUrl?: string }): Promise<any> {
    // Upsert by userId + docType
    const existing = await this.kycModel.findOne({ userId, docType: data.docType });
    if (existing) {
      existing.docNumber = data.docNumber;
      existing.docUrl = data.docUrl || existing.docUrl;
      existing.status = 'pending';
      existing.rejectionReason = undefined;
      await existing.save();
      const obj = existing.toObject(); delete obj._id; delete obj.__v;
      return obj;
    }
    const doc = new this.kycModel({ ...data, userId, id: uuidv4() });
    await doc.save();
    const obj = doc.toObject(); delete obj._id; delete obj.__v;
    return obj;
  }

  async getUserDocuments(userId: string): Promise<any[]> {
    return this.kycModel.find({ userId }).select('-_id -__v').sort({ createdAt: -1 });
  }

  async getAllPending(): Promise<any[]> {
    return this.kycModel.find({ status: 'pending' }).select('-_id -__v').sort({ createdAt: -1 });
  }

  async getAll(): Promise<any[]> {
    return this.kycModel.find().select('-_id -__v').sort({ createdAt: -1 });
  }

  async verify(id: string, status: string, verifiedBy: string, rejectionReason?: string): Promise<any> {
    const doc = await this.kycModel.findOneAndUpdate(
      { id },
      { status, verifiedBy, verifiedAt: new Date(), rejectionReason: rejectionReason || undefined },
      { new: true },
    ).select('-_id -__v');
    if (!doc) throw new NotFoundException('KYC document not found');
    return doc;
  }
}
