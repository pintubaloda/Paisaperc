import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async createWallet(userId: string): Promise<any> {
    return this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, lockedBalance: 0 },
    });
  }

  async getWallet(userId: string): Promise<any> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async addBalance(userId: string, amount: number, remark: string, txnId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: wallet.balance + amount },
      });

      await tx.ledgerEntry.create({
        data: {
          id: uuidv4(),
          userId,
          txnId: txnId || uuidv4(),
          credit: amount,
          debit: 0,
          balanceAfter: updated.balance,
          type: 'CREDIT',
          remark,
        },
      });
    });
  }

  async deductBalance(userId: string, amount: number, remark: string, txnId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (wallet.balance < amount) throw new BadRequestException('Insufficient balance');

      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: wallet.balance - amount },
      });

      await tx.ledgerEntry.create({
        data: {
          id: uuidv4(),
          userId,
          txnId,
          debit: amount,
          credit: 0,
          balanceAfter: updated.balance,
          type: 'DEBIT',
          remark,
        },
      });
    });
  }

  async getLedger(userId: string, limit = 100): Promise<any[]> {
    return this.prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllLedgerEntries(limit = 1000): Promise<any[]> {
    return this.prisma.ledgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllWallets(): Promise<any[]> {
    return this.prisma.wallet.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * Consolidated ledger report:
   * Groups by txnId to show single row per transaction
   * Shows: S.No, User, DateTime, TxnId, Mobile, OpeningBal, NetAmount (after commission), ClosingBal
   */
  async getLedgerReport(filters: { userId?: string; startDate?: string; endDate?: string; limit?: number }): Promise<any[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: filters.limit || 5000,
    });

    // Group by txnId to consolidate double entries
    const txnMap = new Map<string, any>();
    for (const entry of entries) {
      const key = entry.txnId;
      if (!txnMap.has(key)) {
        txnMap.set(key, {
          userId: entry.userId,
          txnId: entry.txnId,
          dateTime: (entry as any).createdAt,
          totalDebit: 0,
          totalCredit: 0,
          remark: entry.remark,
          mobile: '',
        });
      }
      const rec = txnMap.get(key);
      rec.totalDebit += entry.debit || 0;
      rec.totalCredit += entry.credit || 0;
      // Extract mobile from remark
      const mobileMatch = entry.remark?.match(/for\s+(\d{10})/);
      if (mobileMatch) rec.mobile = mobileMatch[1];
      // Use earliest date
      if (new Date((entry as any).createdAt) < new Date(rec.dateTime)) rec.dateTime = (entry as any).createdAt;
      // Combine remarks
      if (!rec.remark.includes(entry.remark) && entry.remark !== rec.remark) {
        rec.remark = entry.remark;
      }
    }

    // Build consolidated report with opening/closing balance
    const consolidatedEntries = Array.from(txnMap.values());
    consolidatedEntries.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    const result = [];
    let runningBalance = 0;

    // Get opening balance by finding first entry's balanceAfter and working backwards
    if (entries.length > 0) {
      const firstEntry = entries[0];
      runningBalance = (firstEntry.balanceAfter || 0) - (firstEntry.credit || 0) + (firstEntry.debit || 0);
    }

    for (let i = 0; i < consolidatedEntries.length; i++) {
      const row = consolidatedEntries[i];
      const netAmount = row.totalCredit - row.totalDebit;
      const openingBal = runningBalance;
      runningBalance += netAmount;
      result.push({
        sNo: i + 1,
        userId: row.userId,
        dateTime: row.dateTime,
        txnId: row.txnId,
        mobile: row.mobile || '-',
        openingBal: parseFloat(openingBal.toFixed(2)),
        netAmount: parseFloat(netAmount.toFixed(2)),
        closingBal: parseFloat(runningBalance.toFixed(2)),
        remark: row.remark,
      });
    }

    return result;
  }
}
