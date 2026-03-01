import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperatorAPIMapping } from './operator-api-mapping.schema';
import { CreateMappingDto, UpdateMappingDto } from './operator-api-mapping.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OperatorAPIMappingService {
  constructor(
    @InjectModel(OperatorAPIMapping.name) private mappingModel: Model<OperatorAPIMapping>,
  ) {}

  async create(createDto: CreateMappingDto): Promise<any> {
    const mapping = new this.mappingModel({
      ...createDto,
      id: uuidv4(),
    });
    await mapping.save();
    const obj = mapping.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findAll(): Promise<any[]> {
    return this.mappingModel.find().select('-_id -__v');
  }

  async findByOperator(operatorId: string): Promise<any[]> {
    return this.mappingModel
      .find({ operatorId, isActive: true })
      .sort({ priority: 1 })
      .select('-_id -__v');
  }

  async update(id: string, updateDto: UpdateMappingDto): Promise<any> {
    const mapping = await this.mappingModel.findOneAndUpdate(
      { id },
      updateDto,
      { new: true }
    ).select('-_id -__v');
    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }
    return mapping;
  }

  async delete(id: string): Promise<void> {
    const result = await this.mappingModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Mapping not found');
    }
  }

  async getBestAPIForOperator(operatorId: string, amount: number): Promise<string | null> {
    const mappings = await this.mappingModel
      .find({
        operatorId,
        isActive: true,
        minAmount: { $lte: amount },
        maxAmount: { $gte: amount },
      })
      .sort({ priority: 1 });

    return mappings.length > 0 ? mappings[0].apiId : null;
  }
}
