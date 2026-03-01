import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoutingRule } from './routing.schema';
import { CreateRoutingRuleDto } from './routing.dto';
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

  async findBestAPI(role: UserRole, operatorId: string, amount: number): Promise<string | null> {
    const rules = await this.routingModel
      .find({
        $or: [
          { role, operatorId, minAmount: { $lte: amount }, maxAmount: { $gte: amount } },
          { role: null, operatorId, minAmount: { $lte: amount }, maxAmount: { $gte: amount } },
          { role, operatorId: null, minAmount: { $lte: amount }, maxAmount: { $gte: amount } },
        ],
      })
      .sort({ priority: 1 });

    return rules.length > 0 ? rules[0].apiId : null;
  }

  async delete(id: string): Promise<void> {
    await this.routingModel.deleteOne({ id });
  }
}
