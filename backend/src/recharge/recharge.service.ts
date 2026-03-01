import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RechargeTransaction } from './recharge.schema';
import { CreateRechargeDto } from './recharge.dto';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';
import { RoutingService } from '../routing/routing.service';
import { TransactionStatus, UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RechargeService {
  constructor(
    @InjectModel(RechargeTransaction.name) private rechargeModel: Model<RechargeTransaction>,
    private walletService: WalletService,
    private commissionService: CommissionService,
    private routingService: RoutingService,
  ) {}

  async createRecharge(userId: string, userRole: UserRole, createDto: CreateRechargeDto): Promise<any> {
    const wallet = await this.walletService.getWallet(userId);
    
    if (wallet.balance < createDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const apiId = await this.routingService.findBestAPI(userRole, createDto.operatorId, createDto.amount);
    
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

    const transaction = new this.rechargeModel({
      id: txnId,
      userId,
      operatorId: createDto.operatorId,
      apiId,
      mobile: createDto.mobile,
      amount: createDto.amount,
      commission,
      status: TransactionStatus.SUCCESS,
      circle: createDto.circle,
      responseCode: '00',
      responseMessage: 'Mock recharge successful',
      providerRef: `MOCK${Date.now()}`,
    });

    await transaction.save();
    
    const obj = transaction.toObject();
    delete obj._id;
    delete obj.__v;
    
    return obj;
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
    const txn = await this.rechargeModel.findOne({ id }).select('-_id -__v');
    return txn;
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
}
