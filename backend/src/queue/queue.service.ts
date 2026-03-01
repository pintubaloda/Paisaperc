import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueJob } from './queue.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QueueService implements OnModuleInit {
  private processing = false;
  private handlers = new Map<string, (payload: any) => Promise<any>>();

  constructor(@InjectModel(QueueJob.name) private queueModel: Model<QueueJob>) {}

  onModuleInit() {
    // Process queue every 5 seconds
    setInterval(() => this.processNext(), 5000);
  }

  registerHandler(type: string, handler: (payload: any) => Promise<any>) {
    this.handlers.set(type, handler);
  }

  async addJob(type: string, payload: any, maxAttempts = 3): Promise<any> {
    const job = new this.queueModel({ id: uuidv4(), type, payload, maxAttempts });
    await job.save();
    const obj = job.toObject(); delete obj._id; delete obj.__v;
    return obj;
  }

  async processNext(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      const job = await this.queueModel.findOneAndUpdate(
        { status: 'pending', attempts: { $lt: 3 } },
        { status: 'processing', $inc: { attempts: 1 } },
        { new: true, sort: { createdAt: 1 } },
      );
      if (!job) return;

      const handler = this.handlers.get(job.type);
      if (!handler) {
        job.status = 'failed';
        job.error = `No handler for type: ${job.type}`;
        await job.save();
        return;
      }

      try {
        const result = await handler(job.payload);
        job.status = 'completed';
        job.result = JSON.stringify(result);
        job.processedAt = new Date();
      } catch (err) {
        if (job.attempts >= job.maxAttempts) {
          job.status = 'failed';
          job.error = err.message;
        } else {
          job.status = 'pending'; // retry
        }
      }
      await job.save();
    } finally {
      this.processing = false;
    }
  }

  async getStats(): Promise<any> {
    const [pending, processing, completed, failed] = await Promise.all([
      this.queueModel.countDocuments({ status: 'pending' }),
      this.queueModel.countDocuments({ status: 'processing' }),
      this.queueModel.countDocuments({ status: 'completed' }),
      this.queueModel.countDocuments({ status: 'failed' }),
    ]);
    return { pending, processing, completed, failed, total: pending + processing + completed + failed };
  }

  async getJobs(status?: string, limit = 50): Promise<any[]> {
    const query = status ? { status } : {};
    return this.queueModel.find(query).sort({ createdAt: -1 }).limit(limit).select('-_id -__v');
  }
}
