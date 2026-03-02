import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisputeService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma.dispute.create({ data: { ...data } });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.dispute.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findUnresolved(): Promise<any[]> {
    return this.prisma.dispute.findMany({
      where: { resolved: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: string, adminAction: string, adminNote: string, resolvedBy: string): Promise<any> {
    const result = await this.prisma.dispute.updateMany({
      where: { id },
      data: {
        resolved: true,
        adminAction,
        adminNote,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    if (result.count === 0) throw new NotFoundException('Dispute not found');

    return this.prisma.dispute.findUnique({ where: { id } });
  }
}
