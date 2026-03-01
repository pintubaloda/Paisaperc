import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Operator } from './operator.schema';
import { CreateOperatorDto, UpdateOperatorDto } from './operator.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OperatorsService {
  constructor(@InjectModel(Operator.name) private operatorModel: Model<Operator>) {}

  generateOpCode(name: string, service: string): string {
    const platformLetter = 'P'; // PaisaPe
    const serviceMap: Record<string, string> = {
      mobile: 'M',
      dth: 'D',
      bill_payment: 'B',
    };
    const serviceLetter = serviceMap[service] || service.charAt(0).toUpperCase();
    const nameLetter = name.charAt(0).toUpperCase();
    return `${platformLetter}${serviceLetter}${nameLetter}`;
  }

  async create(createDto: CreateOperatorDto): Promise<any> {
    const opCode = createDto.opCode || this.generateOpCode(createDto.name, createDto.service);

    const operator = new this.operatorModel({
      ...createDto,
      opCode,
      id: uuidv4(),
    });
    await operator.save();
    const obj = operator.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findAll(): Promise<any[]> {
    return this.operatorModel.find().select('-_id -__v');
  }

  async findById(id: string): Promise<Operator> {
    const operator = await this.operatorModel.findOne({ id });
    if (!operator) {
      throw new NotFoundException('Operator not found');
    }
    return operator;
  }

  async update(id: string, updateDto: UpdateOperatorDto): Promise<any> {
    const operator = await this.operatorModel.findOneAndUpdate(
      { id },
      updateDto,
      { new: true }
    ).select('-_id -__v');
    if (!operator) {
      throw new NotFoundException('Operator not found');
    }
    return operator;
  }

  async delete(id: string): Promise<void> {
    const result = await this.operatorModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Operator not found');
    }
  }
}
