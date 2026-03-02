import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoutingRuleDto, UpdateRoutingRuleDto } from './routing.dto';
import { UserRole } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoutingService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateRoutingRuleDto): Promise<any> {
    return this.prisma.routingRule.create({ data: { ...createDto } });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.routingRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, updateDto: UpdateRoutingRuleDto): Promise<any> {
    const result = await this.prisma.routingRule.updateMany({
      where: { id },
      data: updateDto,
    });

    if (result.count === 0) {
      throw new NotFoundException('Routing rule not found');
    }

    return this.prisma.routingRule.findUnique({ where: { id } });
  }

  async findBestAPIs(role: UserRole, operatorId: string, amount: number): Promise<string[]> {
    const rules = await this.prisma.routingRule.findMany({
      where: {
        isActive: true,
        minAmount: { lte: amount },
        maxAmount: { gte: amount },
        OR: [
          { role, operatorId },
          { role: null, operatorId },
          { role, operatorId: null },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    const allApis: string[] = [];

    for (const rule of rules) {
      for (const apiId of rule.apiPriority || []) {
        if (!allApis.includes(apiId)) {
          allApis.push(apiId);
        }
      }
    }

    return allApis;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.routingRule.deleteMany({ where: { id } });
  }
}
