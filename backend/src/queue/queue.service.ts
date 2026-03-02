import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService implements OnModuleInit {
  private processing = false;
  private handlers = new Map<string, (payload: any) => Promise<any>>();

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    setInterval(() => this.processNext(), 5000);
  }

  registerHandler(type: string, handler: (payload: any) => Promise<any>) {
    this.handlers.set(type, handler);
  }

  async addJob(type: string, payload: any, maxAttempts = 3): Promise<any> {
    return this.prisma.queueJob.create({ data: { type, payload, maxAttempts } });
  }

  async processNext(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const job = await this.prisma.queueJob.findFirst({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
      });

      if (!job) return;

      if (job.attempts >= job.maxAttempts) {
        await this.prisma.queueJob.update({
          where: { id: job.id },
          data: { status: 'failed', error: 'Max attempts exceeded' },
        });
        return;
      }

      const locked = await this.prisma.queueJob.updateMany({
        where: { id: job.id, status: 'pending' },
        data: { status: 'processing', attempts: { increment: 1 } },
      });

      if (locked.count === 0) return;

      const processingJob = await this.prisma.queueJob.findUnique({ where: { id: job.id } });
      if (!processingJob) return;

      const handler = this.handlers.get(processingJob.type);
      if (!handler) {
        await this.prisma.queueJob.update({
          where: { id: processingJob.id },
          data: {
            status: 'failed',
            error: `No handler for type: ${processingJob.type}`,
          },
        });
        return;
      }

      try {
        const result = await handler(processingJob.payload);
        await this.prisma.queueJob.update({
          where: { id: processingJob.id },
          data: {
            status: 'completed',
            result: JSON.stringify(result),
            processedAt: new Date(),
          },
        });
      } catch (err: any) {
        const refreshed = await this.prisma.queueJob.findUnique({ where: { id: processingJob.id } });

        if ((refreshed?.attempts || 0) >= (refreshed?.maxAttempts || 0)) {
          await this.prisma.queueJob.update({
            where: { id: processingJob.id },
            data: { status: 'failed', error: err?.message || 'Unknown queue error' },
          });
        } else {
          await this.prisma.queueJob.update({
            where: { id: processingJob.id },
            data: { status: 'pending' },
          });
        }
      }
    } finally {
      this.processing = false;
    }
  }

  async getStats(): Promise<any> {
    const [pending, processing, completed, failed] = await Promise.all([
      this.prisma.queueJob.count({ where: { status: 'pending' } }),
      this.prisma.queueJob.count({ where: { status: 'processing' } }),
      this.prisma.queueJob.count({ where: { status: 'completed' } }),
      this.prisma.queueJob.count({ where: { status: 'failed' } }),
    ]);

    return { pending, processing, completed, failed, total: pending + processing + completed + failed };
  }

  async getJobs(status?: string, limit = 50): Promise<any[]> {
    return this.prisma.queueJob.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
