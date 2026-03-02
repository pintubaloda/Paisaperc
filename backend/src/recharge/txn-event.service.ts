import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TxnEventService {
  constructor(private prisma: PrismaService) {}

  async log(
    txnId: string,
    event: string,
    description: string,
    status?: string,
    meta?: Record<string, any>,
  ): Promise<void> {
    await this.prisma.txnEvent.create({
      data: {
        txnId,
        event,
        description,
        status,
        meta: meta as any,
      },
    });
  }

  async getTimeline(txnId: string): Promise<any[]> {
    return this.prisma.txnEvent.findMany({
      where: { txnId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
