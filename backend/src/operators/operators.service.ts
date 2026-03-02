import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOperatorDto, UpdateOperatorDto } from './operator.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  generateOpCode(name: string, service: string): string {
    const platformLetter = 'P';
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
    return this.prisma.operator.create({
      data: {
        ...createDto,
        opCode,
      },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.operator.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<any> {
    const operator = await this.prisma.operator.findUnique({ where: { id } });
    if (!operator) {
      throw new NotFoundException('Operator not found');
    }
    return operator;
  }

  async update(id: string, updateDto: UpdateOperatorDto): Promise<any> {
    const operator = await this.prisma.operator.updateMany({
      where: { id },
      data: updateDto,
    });

    if (operator.count === 0) {
      throw new NotFoundException('Operator not found');
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.prisma.operator.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundException('Operator not found');
    }
  }
}
