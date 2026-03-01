import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RechargeTransaction } from './recharge.schema';
import { CreateRechargeDto } from './recharge.dto';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';
import { RoutingService } from '../routing/routing.service';
import { ApiConfigService } from '../api-config/api-config.service';
import { UsersService } from '../users/users.service';
import { TransactionStatus, UserRole } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class RechargeService {
  constructor(
    @InjectModel(RechargeTransaction.name) private rechargeModel: Model<RechargeTransaction>,
    private walletService: WalletService,
    private commissionService: CommissionService,
    private routingService: RoutingService,
    private apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
  ) {}

  /**
   * CORRECT FLOW:
   * 1. Debit amount from wallet
   * 2. Process via API (with failover)
   * 3. If SUCCESS → Credit commission
   * 4. If FAILED → Refund full amount
   * 5. If PENDING → Mark pending (check later)
   */
  async createRecharge(userId: string, userRole: UserRole, createDto: CreateRechargeDto, isSandbox = false): Promise<any> {
    const wallet = await this.walletService.getWallet(userId);
    if (wallet.balance < createDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const txnId = uuidv4();

    // STEP 1: Debit amount FIRST
    await this.walletService.deductBalance(
      userId,
      createDto.amount,
      `Recharge ₹${createDto.amount} for ${createDto.mobile}`,
      txnId,
    );

    // Create transaction record
    const transaction = new this.rechargeModel({
      id: txnId,
      userId,
      operatorId: createDto.operatorId,
      mobile: createDto.mobile,
      amount: createDto.amount,
      status: TransactionStatus.PENDING,
      circle: createDto.circle,
      isSandbox,
    });
    await transaction.save();

    // STEP 2: Process via API
    let apiResult: { status: string; providerRef?: string; message: string; apiId?: string } = {
      status: 'failed', message: 'No API available',
    };

    if (isSandbox) {
      apiResult = this.sandboxProcess();
    } else {
      const apiIds = await this.routingService.findBestAPIs(userRole, createDto.operatorId, createDto.amount);
      for (const apiId of apiIds) {
        try {
          const result = await this.callProviderAPI(apiId, createDto, txnId);
          apiResult = { ...result, apiId };
          if (result.status === 'success' || result.status === 'pending') break;
        } catch (err) {
          apiResult = { status: 'failed', message: err.message, apiId };
        }
      }
    }

    // STEP 3: Handle result
    const commission = await this.commissionService.calculateCommission(userRole, createDto.operatorId, createDto.amount);

    if (apiResult.status === 'success') {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.commission = commission;
      transaction.apiId = apiResult.apiId;
      transaction.providerRef = apiResult.providerRef;
      transaction.responseCode = '00';
      transaction.responseMessage = apiResult.message;
      // Credit commission on success
      if (commission > 0) {
        await this.walletService.addBalance(userId, commission, `Commission ₹${commission} for TXN ${txnId}`, txnId);
      }
    } else if (apiResult.status === 'pending') {
      transaction.status = TransactionStatus.PENDING;
      transaction.apiId = apiResult.apiId;
      transaction.providerRef = apiResult.providerRef;
      transaction.responseCode = 'TUP';
      transaction.responseMessage = apiResult.message;
    } else {
      // FAILED → Refund full amount
      transaction.status = TransactionStatus.FAILED;
      transaction.apiId = apiResult.apiId;
      transaction.responseCode = '01';
      transaction.responseMessage = apiResult.message;
      transaction.refundAmount = createDto.amount;
      await this.walletService.addBalance(userId, createDto.amount, `Refund ₹${createDto.amount} for failed TXN ${txnId}`, txnId);
    }

    await transaction.save();
    const obj = transaction.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  /** Sandbox: random success/pending/failed */
  private sandboxProcess(): { status: string; providerRef?: string; message: string } {
    const rand = Math.random();
    if (rand < 0.5) {
      return { status: 'success', providerRef: `SBX${Date.now()}`, message: 'Sandbox: Success' };
    } else if (rand < 0.75) {
      return { status: 'pending', providerRef: `SBX${Date.now()}`, message: 'Sandbox: Pending' };
    } else {
      return { status: 'failed', message: 'Sandbox: Failed' };
    }
  }

  /** Call actual provider API */
  private async callProviderAPI(apiId: string, dto: CreateRechargeDto, txnId: string): Promise<{ status: string; providerRef?: string; message: string }> {
    try {
      const apiConfig = await this.apiConfigService.findById(apiId);
      const cfg = apiConfig.toObject();
      const url = `${cfg.protocol}://${cfg.domain}${cfg.endpoint}`;

      // Build params replacing dynamic values
      const params: Record<string, string> = {};
      for (const p of (cfg.parameters || [])) {
        let val = p.fieldValue;
        if (p.isDynamic) {
          val = val.replace('[number]', dto.mobile)
            .replace('[op_code]', dto.operatorId)
            .replace('[amount]', String(dto.amount))
            .replace('[txn_id]', txnId)
            .replace('[token]', cfg.authToken || '')
            .replace('[circle]', dto.circle || '');
        }
        params[p.fieldName] = val;
      }

      const headers: Record<string, string> = {};
      for (const h of (cfg.headers || [])) {
        headers[h.key] = h.value;
      }

      let response: any;
      if (cfg.method === 'GET') {
        response = await axios.get(url, { params, headers, timeout: 30000 });
      } else {
        response = await axios.post(url, params, { headers, timeout: 30000 });
      }

      const data = response.data;
      const statusField = cfg.successField || 'status';
      const statusVal = data[statusField];

      if (statusVal === (cfg.successValue || 'Success')) {
        return { status: 'success', providerRef: data[cfg.txnIdField || 'txnid'] || `P${Date.now()}`, message: data[cfg.messageField || 'status_msg'] || 'Success' };
      } else if (statusVal === (cfg.pendingValue || 'Pending')) {
        return { status: 'pending', providerRef: data[cfg.txnIdField || 'txnid'], message: data[cfg.messageField || 'status_msg'] || 'Pending' };
      } else {
        return { status: 'failed', message: data[cfg.messageField || 'status_msg'] || 'Failed' };
      }
    } catch (err) {
      return { status: 'failed', message: `API Error: ${err.message}` };
    }
  }

  /** Retry failed: refund was already done, so debit again, process, handle result */
  async retryFailedTransaction(txnId: string): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId });
    if (!transaction) throw new BadRequestException('Transaction not found');
    if (transaction.status !== TransactionStatus.FAILED) throw new BadRequestException('Only failed transactions can be retried');

    // Re-process as new recharge using same details
    const result = await this.createRecharge(
      transaction.userId,
      UserRole.RETAILER,
      { operatorId: transaction.operatorId, mobile: transaction.mobile, amount: transaction.amount, circle: transaction.circle },
      transaction.isSandbox,
    );
    return result;
  }

  /** Check status of pending transaction */
  async checkPendingStatus(txnId: string): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId });
    if (!transaction) throw new BadRequestException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING) {
      const obj = transaction.toObject(); delete obj._id; delete obj.__v;
      return obj;
    }

    if (transaction.isSandbox) {
      const rand = Math.random();
      if (rand < 0.6) {
        // Resolve as success
        const commission = await this.commissionService.calculateCommission(UserRole.RETAILER, transaction.operatorId, transaction.amount);
        transaction.status = TransactionStatus.SUCCESS;
        transaction.commission = commission;
        transaction.responseCode = '00';
        transaction.responseMessage = 'Sandbox: Resolved as Success';
        if (commission > 0) {
          await this.walletService.addBalance(transaction.userId, commission, `Commission ₹${commission} for TXN ${txnId}`, txnId);
        }
      } else if (rand < 0.8) {
        // Still pending
      } else {
        // Resolve as failed → refund
        transaction.status = TransactionStatus.FAILED;
        transaction.responseCode = '01';
        transaction.responseMessage = 'Sandbox: Resolved as Failed';
        transaction.refundAmount = transaction.amount;
        await this.walletService.addBalance(transaction.userId, transaction.amount, `Refund ₹${transaction.amount} for failed TXN ${txnId}`, txnId);
      }
      await transaction.save();
    } else if (transaction.apiId) {
      try {
        const apiConfig = await this.apiConfigService.findById(transaction.apiId);
        const cfg = apiConfig.toObject();
        if (cfg.statusCheckEndpoint) {
          const checkUrl = `${cfg.protocol}://${cfg.domain}${cfg.statusCheckEndpoint}`;
          const checkParams: Record<string, string> = {};
          for (const p of (cfg.statusCheckParams || [])) {
            let val = p.fieldValue;
            if (p.isDynamic) {
              val = val.replace('[txn_id]', txnId).replace('[token]', cfg.authToken || '');
            }
            checkParams[p.fieldName] = val;
          }
          const response = await axios.get(checkUrl, { params: checkParams, timeout: 30000 });
          const data = response.data;
          const statusVal = data[cfg.successField || 'status'];

          if (statusVal === (cfg.successValue || 'Success')) {
            const commission = await this.commissionService.calculateCommission(UserRole.RETAILER, transaction.operatorId, transaction.amount);
            transaction.status = TransactionStatus.SUCCESS;
            transaction.commission = commission;
            transaction.providerRef = data[cfg.txnIdField || 'txnid'];
            transaction.responseCode = '00';
            transaction.responseMessage = data[cfg.messageField || 'status_msg'] || 'Success';
            if (commission > 0) {
              await this.walletService.addBalance(transaction.userId, commission, `Commission ₹${commission} for TXN ${txnId}`, txnId);
            }
          } else if (statusVal === (cfg.failedValue || 'Failed')) {
            transaction.status = TransactionStatus.FAILED;
            transaction.responseCode = '01';
            transaction.responseMessage = data[cfg.messageField || 'status_msg'] || 'Failed';
            transaction.refundAmount = transaction.amount;
            await this.walletService.addBalance(transaction.userId, transaction.amount, `Refund ₹${transaction.amount} for failed TXN ${txnId}`, txnId);
          }
          await transaction.save();
        }
      } catch (err) {
        // Status check failed, keep pending
      }
    }

    const obj = transaction.toObject(); delete obj._id; delete obj.__v;
    return obj;
  }

  private async enrichWithUserNames(transactions: any[]): Promise<any[]> {
    const userIds = [...new Set(transactions.map(t => t.userId))];
    const userMap: Record<string, string> = {};
    for (const uid of userIds) {
      try {
        const user = await this.usersService.findById(uid);
        userMap[uid] = user?.name || uid;
      } catch { userMap[uid] = uid; }
    }
    return transactions.map(t => {
      const obj = typeof t.toObject === 'function' ? t.toObject() : { ...t };
      delete obj._id; delete obj.__v;
      return { ...obj, userName: userMap[obj.userId] || obj.userId };
    });
  }

  async getTransactions(userId: string, limit = 100): Promise<any[]> {
    const txns = await this.rechargeModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    return txns.map(t => { const o = { ...t } as any; delete o._id; delete o.__v; return o; });
  }

  async getAllTransactions(limit = 1000): Promise<any[]> {
    const txns = await this.rechargeModel.find().sort({ createdAt: -1 }).limit(limit).lean();
    return this.enrichWithUserNames(txns);
  }

  async getTransactionById(id: string): Promise<any> {
    return this.rechargeModel.findOne({ id }).select('-_id -__v');
  }

  async getStats(): Promise<any> {
    const totalTransactions = await this.rechargeModel.countDocuments();
    const successTransactions = await this.rechargeModel.countDocuments({ status: TransactionStatus.SUCCESS });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayTransactions = await this.rechargeModel.countDocuments({ createdAt: { $gte: today } });
    const volumeResult = await this.rechargeModel.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const todayVolumeResult = await this.rechargeModel.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const pendingCount = await this.rechargeModel.countDocuments({ status: TransactionStatus.PENDING });
    const successRate = totalTransactions > 0 ? (successTransactions / totalTransactions) * 100 : 0;
    return {
      totalTransactions, totalVolume: volumeResult[0]?.total || 0,
      todayTransactions, todayVolume: todayVolumeResult[0]?.total || 0,
      pendingRecharges: pendingCount, successRate: successRate.toFixed(2),
    };
  }

  async getFailedTransactions(limit = 100): Promise<any[]> {
    const txns = await this.rechargeModel.find({ status: TransactionStatus.FAILED }).sort({ createdAt: -1 }).limit(limit).lean();
    return this.enrichWithUserNames(txns);
  }

  async getPendingTransactions(limit = 100): Promise<any[]> {
    const txns = await this.rechargeModel.find({ status: TransactionStatus.PENDING }).sort({ createdAt: -1 }).limit(limit).lean();
    return this.enrichWithUserNames(txns);
  }

  /** Sandbox bulk test */
  async sandboxBulkTest(userId: string, count: number, operators: string[], tpm: number): Promise<any> {
    const results = { total: count, success: 0, failed: 0, pending: 0, errors: 0, totalDebited: 0, totalCommission: 0, totalRefunded: 0 };
    const delay = tpm > 0 ? Math.floor(60000 / tpm) : 0;

    for (let i = 0; i < count; i++) {
      const opId = operators[i % operators.length];
      const amount = [99, 149, 199, 249, 299][Math.floor(Math.random() * 5)];
      const mobile = `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      try {
        const txn = await this.createRecharge(userId, UserRole.RETAILER, { operatorId: opId, mobile, amount }, true);
        results.totalDebited += amount;
        if (txn.status === 'success') { results.success++; results.totalCommission += txn.commission || 0; }
        else if (txn.status === 'pending') { results.pending++; }
        else { results.failed++; results.totalRefunded += txn.refundAmount || 0; }
      } catch (err) {
        results.errors++;
        if (err.message?.includes('Insufficient balance')) break;
      }
      if (delay > 0 && i < count - 1) await new Promise(r => setTimeout(r, Math.min(delay, 100)));
    }
    return results;
  }
}
