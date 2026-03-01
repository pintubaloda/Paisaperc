import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoutingRule } from './routing.schema';
import { CreateRoutingRuleDto, UpdateRoutingRuleDto } from './routing.dto';
import { UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoutingService {
  constructor(@InjectModel(RoutingRule.name) private routingModel: Model<RoutingRule>) {}

  async create(createDto: CreateRoutingRuleDto): Promise<any> {
    const rule = new this.routingModel({
      ...createDto,
      id: uuidv4(),
    });
    await rule.save();
    const obj = rule.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findAll(): Promise<any[]> {
    return this.routingModel.find().select('-_id -__v');
  }

  async update(id: string, updateDto: UpdateRoutingRuleDto): Promise<any> {
    const rule = await this.routingModel.findOneAndUpdate(
      { id },
      updateDto,
      { new: true },
    ).select('-_id -__v');
    if (!rule) {
      throw new NotFoundException('Routing rule not found');
    }
    return rule;
  }

  async findBestAPIs(role: UserRole, operatorId: string, amount: number): Promise<string[]> {
    const rules = await this.routingModel
      .find({
        isActive: true,
        $or: [
          { role, operatorId, minAmount: { $lte: amount }, maxAmount: { $gte: amount } },
          { role: null, operatorId, minAmount: { $lte: amount }, maxAmount: { $gte: amount } },
          { role, operatorId: null, minAmount: { $lte: amount }, maxAmount: { $gte: amount } },
        ],
      })
      .sort({ createdAt: 1 });

    const allApis: string[] = [];
    for (const rule of rules) {
      for (const apiId of rule.apiPriority) {
        if (!allApis.includes(apiId)) {
          allApis.push(apiId);
        }
      }
    }
    return allApis;
  }

  async delete(id: string): Promise<void> {
    await this.routingModel.deleteOne({ id });
  }
}
