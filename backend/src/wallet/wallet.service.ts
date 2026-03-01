import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async addBalance(userId: string, amount: number, remark: string, txnId?: string): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    wallet.balance += amount;
    const newBalance = wallet.balance;
    await wallet.save();

    const ledgerEntry = new this.ledgerModel({
      id: uuidv4(),
      userId,
      txnId: txnId || uuidv4(),
      credit: amount,
      debit: 0,
      balanceAfter: newBalance,
      type: 'CREDIT',
      remark,
    });
    await ledgerEntry.save();
  }

  async deductBalance(
    userId: string,
    amount: number,
    remark: string,
    txnId: string,
  ): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.balance -= amount;
    const newBalance = wallet.balance;
    await wallet.save();

    const ledgerEntry = new this.ledgerModel({
      id: uuidv4(),
      userId,
      txnId,
      debit: amount,
      credit: 0,
      balanceAfter: newBalance,
      type: 'DEBIT',
      remark,
    });
    await ledgerEntry.save();
  }

  async getLedger(userId: string, limit: number = 100): Promise<any[]> {
    const entries = await this.ledgerModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-_id -__v');
    return entries;
  }

  async getAllLedgerEntries(limit: number = 1000): Promise<any[]> {
    const entries = await this.ledgerModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-_id -__v');
    return entries;
  }
}
