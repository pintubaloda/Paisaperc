import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMappingDto, UpdateMappingDto } from './operator-api-mapping.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorAPIMappingService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateMappingDto): Promise<any> {
    return this.prisma.operatorApiMapping.create({ data: { ...createDto } });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.operatorApiMapping.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findByOperator(operatorId: string): Promise<any[]> {
    return this.prisma.operatorApiMapping.findMany({
      where: { operatorId, isActive: true },
      orderBy: { priority: 'asc' },
    });
  }

  async update(id: string, updateDto: UpdateMappingDto): Promise<any> {
    const result = await this.prisma.operatorApiMapping.updateMany({
      where: { id },
      data: updateDto,
    });

    if (result.count === 0) {
      throw new NotFoundException('Mapping not found');
    }

    return this.prisma.operatorApiMapping.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    const result = await this.prisma.operatorApiMapping.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundException('Mapping not found');
    }
  }

  async getBestAPIForOperator(operatorId: string, amount: number): Promise<string | null> {
    const mapping = await this.prisma.operatorApiMapping.findFirst({
      where: {
        operatorId,
        isActive: true,
        minAmount: { lte: amount },
        maxAmount: { gte: amount },
      },
      orderBy: { priority: 'asc' },
    });

    return mapping?.apiId || null;
  }
}
