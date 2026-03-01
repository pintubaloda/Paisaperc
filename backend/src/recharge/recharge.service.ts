import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RechargeTransaction } from './recharge.schema';
import { CreateRechargeDto } from './recharge.dto';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';
import { RoutingService } from '../routing/routing.service';
import { ApiConfigService } from '../api-config/api-config.service';
import { TransactionStatus, UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RechargeService {
  constructor(
    @InjectModel(RechargeTransaction.name) private rechargeModel: Model<RechargeTransaction>,
    private walletService: WalletService,
    private commissionService: CommissionService,
    private routingService: RoutingService,
    private apiConfigService: ApiConfigService,
  ) {}

  async createRecharge(userId: string, userRole: UserRole, createDto: CreateRechargeDto): Promise<any> {
    const wallet = await this.walletService.getWallet(userId);
    
    if (wallet.balance < createDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const apiIds = await this.routingService.findBestAPIs(userRole, createDto.operatorId, createDto.amount);
    
    const commission = await this.commissionService.calculateCommission(
      userRole,
      createDto.operatorId,
      createDto.amount,
    );

    const txnId = uuidv4();
    
    await this.walletService.deductBalance(
      userId,
      createDto.amount,
      `Recharge for ${createDto.mobile}`,
      txnId,
    );

    if (commission > 0) {
      await this.walletService.addBalance(
        userId,
        commission,
        `Commission for txn ${txnId}`,
        txnId,
      );
    }

    let finalStatus = TransactionStatus.FAILED;
    let finalApiId = apiIds.length > 0 ? apiIds[0] : null;
    let providerRef = null;
    let responseCode = '99';
    let responseMessage = 'No API available';
    let attempts = [];

    for (const apiId of apiIds) {
      try {
        const result = this.simulateApiCall(apiId);
        attempts.push({ apiId, status: result.success ? 'success' : 'failed', message: result.message });
        if (result.success) {
          finalStatus = TransactionStatus.SUCCESS;
          finalApiId = apiId;
          providerRef = result.providerRef;
          responseCode = '00';
          responseMessage = result.message;
          break;
        }
      } catch (err) {
        attempts.push({ apiId, status: 'error', message: err.message });
      }
    }

    const transaction = new this.rechargeModel({
      id: txnId,
      userId,
      operatorId: createDto.operatorId,
      apiId: finalApiId,
      mobile: createDto.mobile,
      amount: createDto.amount,
      commission,
      status: finalStatus,
      circle: createDto.circle,
      responseCode,
      responseMessage,
      providerRef: providerRef || `MOCK${Date.now()}`,
    });

    await transaction.save();
    
    const obj = transaction.toObject();
    delete obj._id;
    delete obj.__v;
    
    return { ...obj, attempts };
  }

  private simulateApiCall(apiId: string): { success: boolean; message: string; providerRef?: string } {
    const success = Math.random() > 0.3;
    return {
      success,
      message: success ? 'Recharge successful' : 'API provider returned failure',
      providerRef: success ? `REF${Date.now()}` : undefined,
    };
  }

  async getTransactions(userId: string, limit: number = 100): Promise<any[]> {
    return this.rechargeModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-_id -__v');
  }

  async getAllTransactions(limit: number = 1000): Promise<any[]> {
    return this.rechargeModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-_id -__v');
  }

  async getTransactionById(id: string): Promise<any> {
    return this.rechargeModel.findOne({ id }).select('-_id -__v');
  }

  async getStats(): Promise<any> {
    const totalTransactions = await this.rechargeModel.countDocuments();
    const successTransactions = await this.rechargeModel.countDocuments({ status: TransactionStatus.SUCCESS });
    
    const volumeResult = await this.rechargeModel.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalVolume = volumeResult.length > 0 ? volumeResult[0].total : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = await this.rechargeModel.countDocuments({
      createdAt: { $gte: today },
    });
    
    const todayVolumeResult = await this.rechargeModel.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayVolume = todayVolumeResult.length > 0 ? todayVolumeResult[0].total : 0;
    
    const pendingCount = await this.rechargeModel.countDocuments({ status: TransactionStatus.PENDING });
    const successRate = totalTransactions > 0 ? (successTransactions / totalTransactions) * 100 : 0;
    
    return {
      totalTransactions,
      totalVolume,
      todayTransactions,
      todayVolume,
      pendingRecharges: pendingCount,
      successRate: successRate.toFixed(2),
    };
  }

  async retryFailedTransaction(txnId: string): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.FAILED) {
      throw new Error('Only failed transactions can be retried');
    }

    transaction.status = TransactionStatus.PENDING;
    transaction.responseCode = null;
    transaction.responseMessage = 'Retrying transaction';
    await transaction.save();

    const success = Math.random() > 0.3;
    transaction.status = success ? TransactionStatus.SUCCESS : TransactionStatus.FAILED;
    transaction.responseCode = success ? '00' : '01';
    transaction.responseMessage = success ? 'Transaction successful after retry' : 'Retry failed';
    transaction.providerRef = success ? `RETRY${Date.now()}` : transaction.providerRef;
    await transaction.save();

    const obj = transaction.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async checkTransactionStatus(txnId: string): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId }).select('-_id -__v');
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  async getFailedTransactions(limit: number = 100): Promise<any[]> {
    return this.rechargeModel
      .find({ status: TransactionStatus.FAILED })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-_id -__v');
  }

  async getPendingTransactions(limit: number = 100): Promise<any[]> {
    return this.rechargeModel
      .find({ status: TransactionStatus.PENDING })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-_id -__v');
  }
}
