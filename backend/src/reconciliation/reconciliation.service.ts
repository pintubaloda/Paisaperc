import { Injectable, OnModuleInit } from '@nestjs/common';
import { TransactionStatus } from '../common/enums';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationService implements OnModuleInit {
  private intervalId: any;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.intervalId = setInterval(() => this.runReconciliation(), 10 * 60 * 1000);
  }

  async runReconciliation(): Promise<any> {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const stalePending = await this.prisma.rechargeTransaction.findMany({
      where: {
        status: TransactionStatus.PENDING as any,
        createdAt: { lt: thirtyMinAgo },
      },
      select: { id: true },
    });

    return {
      runAt: now.toISOString(),
      stalePendingCount: stalePending.length,
      stalePendingIds: stalePending.map((t: any) => t.id),
    };
  }

  async getReport(): Promise<any> {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const [totalPending, stalePending, todaySuccess, todayFailed, todayDisputes, todayVolume] = await Promise.all([
      this.prisma.rechargeTransaction.count({ where: { status: TransactionStatus.PENDING as any } }),
      this.prisma.rechargeTransaction.count({
        where: {
          status: TransactionStatus.PENDING as any,
          createdAt: { lt: thirtyMinAgo },
        },
      }),
      this.prisma.rechargeTransaction.count({
        where: {
          status: TransactionStatus.SUCCESS as any,
          createdAt: { gte: today },
        },
      }),
      this.prisma.rechargeTransaction.count({
        where: {
          status: TransactionStatus.FAILED as any,
          createdAt: { gte: today },
        },
      }),
      this.prisma.rechargeTransaction.count({ where: { status: TransactionStatus.DISPUTE as any } }),
      this.prisma.rechargeTransaction.aggregate({
        where: {
          createdAt: { gte: today },
          status: TransactionStatus.SUCCESS as any,
        },
        _sum: { amount: true, commission: true },
      }),
    ]);

    return {
      totalPending,
      stalePending,
      todaySuccess,
      todayFailed,
      todayDisputes,
      todayVolume: todayVolume._sum.amount || 0,
      todayCommission: todayVolume._sum.commission || 0,
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
              txn = await this.prisma.rechargeTransaction.findUnique({ where: { id: txnId } });
            }

            if (!txn && providerRef) {
              txn = await this.prisma.rechargeTransaction.findFirst({ where: { providerRef } });
            }

            if (!txn) {
              notFound.push({ txnId, providerRef, providerStatus, providerAmount });
              continue;
            }

            const ourStatus = txn.status;
            const ourAmount = txn.amount;

            let statusMatch = false;
            if (providerStatus.includes('success') && ourStatus === 'success') statusMatch = true;
            if (providerStatus.includes('fail') && ourStatus === 'failed') statusMatch = true;
            if (providerStatus.includes('pending') && ourStatus === 'pending') statusMatch = true;

            const amountMatch = !providerAmount || providerAmount === ourAmount;

            if (statusMatch && amountMatch) {
              matched.push({
                txnId: txn.id,
                ourStatus,
                providerStatus,
                amount: ourAmount,
              });
            } else {
              mismatched.push({
                txnId: txn.id,
                ourStatus,
                providerStatus,
                ourAmount,
                providerAmount,
                providerRef: txn.providerRef,
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
