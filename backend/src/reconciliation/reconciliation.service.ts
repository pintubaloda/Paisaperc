import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RechargeTransaction } from '../recharge/recharge.schema';
import { TransactionStatus } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class ReconciliationService implements OnModuleInit {
  private intervalId: any;

  constructor(
    @InjectModel(RechargeTransaction.name) private rechargeModel: Model<RechargeTransaction>,
  ) {}

  onModuleInit() {
    this.intervalId = setInterval(() => this.runReconciliation(), 10 * 60 * 1000);
  }

  async runReconciliation(): Promise<any> {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

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

  async importProviderReport(fileBuffer: Buffer, fileName: string): Promise<any> {
    const results: any[] = [];
    const matched: any[] = [];
    const mismatched: any[] = [];
    const notFound: any[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer);
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', async () => {
          for (const row of results) {
            const txnId = row.txnId || row.txn_id || row.transaction_id || row.TransactionID || '';
            const providerRef = row.providerRef || row.provider_ref || row.ProviderRef || row.ReferenceID || '';
            const providerStatus = (row.status || row.Status || '').toLowerCase();
            const providerAmount = parseFloat(row.amount || row.Amount || '0');

            if (!txnId && !providerRef) continue;

            let txn: any = null;
            if (txnId) {
              txn = await this.rechargeModel.findOne({ id: txnId }).lean();
            }
            if (!txn && providerRef) {
              txn = await this.rechargeModel.findOne({ providerRef }).lean();
            }

            if (!txn) {
              notFound.push({ txnId, providerRef, providerStatus, providerAmount });
              continue;
            }

            const ourStatus = (txn as any).status;
            const ourAmount = (txn as any).amount;

            let statusMatch = false;
            if (providerStatus.includes('success') && ourStatus === 'success') statusMatch = true;
            if (providerStatus.includes('fail') && ourStatus === 'failed') statusMatch = true;
            if (providerStatus.includes('pending') && ourStatus === 'pending') statusMatch = true;

            const amountMatch = !providerAmount || providerAmount === ourAmount;

            if (statusMatch && amountMatch) {
              matched.push({
                txnId: (txn as any).id,
                ourStatus,
                providerStatus,
                amount: ourAmount,
              });
            } else {
              mismatched.push({
                txnId: (txn as any).id,
                ourStatus,
                providerStatus,
                ourAmount,
                providerAmount,
                providerRef: (txn as any).providerRef,
              });
            }
          }

          resolve({
            fileName,
            totalRows: results.length,
            matched: matched.length,
            mismatched: mismatched.length,
            notFound: notFound.length,
            mismatchedDetails: mismatched,
            notFoundDetails: notFound,
            importedAt: new Date().toISOString(),
          });
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
}
