import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { APIMaster } from './api-master.schema';
import { CreateAPIDto, UpdateAPIDto } from './api-config.dto';
import { ServiceType } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiConfigService {
  constructor(@InjectModel(APIMaster.name) private apiModel: Model<APIMaster>) {}

  async create(createDto: CreateAPIDto): Promise<any> {
    const api = new this.apiModel({
      ...createDto,
      id: uuidv4(),
    });
    await api.save();
    const obj = api.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findAll(): Promise<any[]> {
    return this.apiModel.find().select('-_id -__v');
  }

  async findById(id: string): Promise<APIMaster> {
    const api = await this.apiModel.findOne({ id });
    if (!api) {
      throw new NotFoundException('API not found');
    }
    return api;
  }

  async update(id: string, updateDto: UpdateAPIDto): Promise<any> {
    const api = await this.apiModel.findOneAndUpdate(
      { id },
      updateDto,
      { new: true }
    ).select('-_id -__v');
    if (!api) {
      throw new NotFoundException('API not found');
    }
    return api;
  }

  async delete(id: string): Promise<void> {
    const result = await this.apiModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('API not found');
    }
  }

  async getActiveAPIs(apiType: ServiceType): Promise<APIMaster[]> {
    return this.apiModel.find({ apiType, isActive: true });
  }

  async updateOperatorCodes(id: string, operatorCodes: any[]): Promise<any> {
    const api = await this.apiModel.findOneAndUpdate(
      { id },
      { operatorCodes },
      { new: true }
    ).select('-_id -__v');
    if (!api) {
      throw new NotFoundException('API not found');
    }
    return api;
  }

  async updateResponseMappings(id: string, data: any): Promise<any> {
    const api = await this.apiModel.findOneAndUpdate(
      { id },
      {
        responseMappings: data.responseMappings,
        sampleRequest: data.sampleRequest,
        sampleResponse: data.sampleResponse,
      },
      { new: true }
    ).select('-_id -__v');
    if (!api) {
      throw new NotFoundException('API not found');
    }
    return api;
  }
}
