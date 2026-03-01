import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RechargeTransaction } from '../recharge/recharge.schema';
import { TransactionStatus } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReconciliationService implements OnModuleInit {
  private intervalId: any;

  constructor(
    @InjectModel(RechargeTransaction.name) private rechargeModel: Model<RechargeTransaction>,
  ) {}

  onModuleInit() {
    // Run reconciliation every 10 minutes
    this.intervalId = setInterval(() => this.runReconciliation(), 10 * 60 * 1000);
  }

  async runReconciliation(): Promise<any> {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Find stale pending transactions (older than 30 mins)
    const stalePending = await this.rechargeModel.find({
      status: TransactionStatus.PENDING,
      createdAt: { $lt: thirtyMinAgo },
    }).lean();

    return {
      runAt: now.toISOString(),
      stalePendingCount: stalePending.length,
      stalePendingIds: stalePending.map((t: any) => t.id),
    };
  }

  async getReport(): Promise<any> {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const [totalPending, stalePending, todaySuccess, todayFailed, todayDisputes] = await Promise.all([
      this.rechargeModel.countDocuments({ status: TransactionStatus.PENDING }),
      this.rechargeModel.countDocuments({ status: TransactionStatus.PENDING, createdAt: { $lt: thirtyMinAgo } }),
      this.rechargeModel.countDocuments({ status: TransactionStatus.SUCCESS, createdAt: { $gte: today } }),
      this.rechargeModel.countDocuments({ status: TransactionStatus.FAILED, createdAt: { $gte: today } }),
      this.rechargeModel.countDocuments({ status: TransactionStatus.DISPUTE }),
    ]);

    const todayVolume = await this.rechargeModel.aggregate([
      { $match: { createdAt: { $gte: today }, status: TransactionStatus.SUCCESS } },
      { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission' } } },
    ]);

    return {
      totalPending,
      stalePending,
      todaySuccess,
      todayFailed,
      todayDisputes,
      todayVolume: todayVolume[0]?.total || 0,
      todayCommission: todayVolume[0]?.commission || 0,
      lastRun: new Date().toISOString(),
    };
  }
}
