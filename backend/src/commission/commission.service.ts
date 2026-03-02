import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommissionDto, UpdateCommissionDto } from './commission.dto';
import { UserRole } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCommissionDto): Promise<any> {
    return this.prisma.commission.create({ data: { ...createDto } });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.commission.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, updateDto: UpdateCommissionDto): Promise<any> {
    const updated = await this.prisma.commission.updateMany({
      where: { id },
      data: updateDto,
    });

    if (updated.count === 0) {
      throw new NotFoundException('Commission not found');
    }

    return this.prisma.commission.findUnique({ where: { id } });
  }

  async calculateCommission(role: UserRole, operatorId: string, amount: number): Promise<number> {
    const commission = await this.prisma.commission.findFirst({
      where: { role, operatorId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!commission) return 0;

    if (commission.commissionType === 'percentage') {
      return (amount * commission.commissionValue) / 100;
    }

    return commission.commissionValue;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.commission.deleteMany({ where: { id } });
  }
}
