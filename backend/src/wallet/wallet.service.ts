import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, LedgerEntry } from './wallet.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(LedgerEntry.name) private ledgerModel: Model<LedgerEntry>,
  ) {}

  async createWallet(userId: string): Promise<Wallet> {
    const wallet = new this.walletModel({ userId, balance: 0, lockedBalance: 0 });
    return wallet.save();
  }

  async getWallet(userId: string): Promise<any> {
    const wallet = await this.walletModel.findOne({ userId }).select('-_id -__v');
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async addBalance(userId: string, amount: number, remark: string, txnId?: string): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');
    wallet.balance += amount;
    const newBalance = wallet.balance;
    await wallet.save();
    const ledgerEntry = new this.ledgerModel({
      id: uuidv4(), userId, txnId: txnId || uuidv4(),
      credit: amount, debit: 0, balanceAfter: newBalance, type: 'CREDIT', remark,
    });
    await ledgerEntry.save();
  }

  async deductBalance(userId: string, amount: number, remark: string, txnId: string): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.balance < amount) throw new BadRequestException('Insufficient balance');
    wallet.balance -= amount;
    const newBalance = wallet.balance;
    await wallet.save();
    const ledgerEntry = new this.ledgerModel({
      id: uuidv4(), userId, txnId, debit: amount, credit: 0, balanceAfter: newBalance, type: 'DEBIT', remark,
    });
    await ledgerEntry.save();
  }

  async getLedger(userId: string, limit = 100): Promise<any[]> {
    return this.ledgerModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).select('-_id -__v');
  }

  async getAllLedgerEntries(limit = 1000): Promise<any[]> {
    return this.ledgerModel.find().sort({ createdAt: -1 }).limit(limit).select('-_id -__v');
  }

  async getAllWallets(): Promise<any[]> {
    return this.walletModel.find().select('-_id -__v');
  }

  /**
   * Consolidated ledger report:
   * Groups by txnId to show single row per transaction
   * Shows: S.No, User, DateTime, TxnId, Mobile, OpeningBal, NetAmount (after commission), ClosingBal
   */
  async getLedgerReport(filters: { userId?: string; startDate?: string; endDate?: string; limit?: number }): Promise<any[]> {
    const query: any = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const entries = await this.ledgerModel.find(query).sort({ createdAt: 1 }).limit(filters.limit || 5000).lean();

    // Group by txnId to consolidate double entries
    const txnMap = new Map<string, any>();
    for (const entry of entries) {
      const key = entry.txnId;
      if (!txnMap.has(key)) {
        txnMap.set(key, {
          userId: entry.userId,
          txnId: entry.txnId,
          dateTime: entry.createdAt,
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
      if (new Date(entry.createdAt) < new Date(rec.dateTime)) rec.dateTime = entry.createdAt;
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
