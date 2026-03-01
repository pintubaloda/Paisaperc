import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Commission } from './commission.schema';
import { CreateCommissionDto, UpdateCommissionDto } from './commission.dto';
import { UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommissionService {
  constructor(@InjectModel(Commission.name) private commissionModel: Model<Commission>) {}

  async create(createDto: CreateCommissionDto): Promise<any> {
    const commission = new this.commissionModel({
      ...createDto,
      id: uuidv4(),
    });
    await commission.save();
    const obj = commission.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findAll(): Promise<any[]> {
    return this.commissionModel.find().select('-_id -__v');
  }

  async update(id: string, updateDto: UpdateCommissionDto): Promise<any> {
    const commission = await this.commissionModel.findOneAndUpdate(
      { id },
      updateDto,
      { new: true },
    ).select('-_id -__v');
    if (!commission) {
      throw new NotFoundException('Commission not found');
    }
    return commission;
  }

  async calculateCommission(role: UserRole, operatorId: string, amount: number): Promise<number> {
    const commission = await this.commissionModel.findOne({ role, operatorId, isActive: true });
    if (!commission) return 0;

    if (commission.commissionType === 'percentage') {
      return (amount * commission.commissionValue) / 100;
    } else {
      return commission.commissionValue;
    }
  }

  async delete(id: string): Promise<void> {
    await this.commissionModel.deleteOne({ id });
  }
}
