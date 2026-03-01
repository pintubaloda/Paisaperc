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
import { OperatorsService } from '../operators/operators.service';
import { TransactionStatus, UserRole } from '../common/enums';
import { TxnEventService } from './txn-event.service';
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
    private operatorsService: OperatorsService,
    private txnEvents: TxnEventService,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
  ) {}

  /** Replace dynamic placeholders in a string */
  private substituteVars(
    template: string,
    vars: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.split(`[${key}]`).join(value);
    }
    return result;
  }

  /** Build a vars map from transaction data + API config */
  private buildVarsMap(
    dto: { mobile: string; operatorId: string; amount: number; circle?: string },
    txnId: string,
    cfg: any,
  ): Record<string, string> {
    // Resolve operator code from operator code mapping
    let opCode = dto.operatorId;
    if (cfg.operatorCodes?.length) {
      const mapping = cfg.operatorCodes.find(
        (m: any) => m.operatorId === dto.operatorId,
      );
      if (mapping?.providerCode) {
        opCode = mapping.providerCode;
      }
    }

    return {
      number: dto.mobile,
      op_code: opCode,
      amount: String(dto.amount),
      txn_id: txnId,
      token: cfg.authToken || '',
      circle: dto.circle || '',
    };
  }

  /**
   * CORRECT FLOW:
   * 1. Debit amount from wallet
   * 2. Process via API (with failover)
   * 3. If SUCCESS -> Credit commission
   * 4. If FAILED -> Refund full amount
   * 5. If PENDING -> Mark pending (check later)
   */
  async createRecharge(
    userId: string,
    userRole: UserRole,
    createDto: CreateRechargeDto,
    isSandbox = false,
  ): Promise<any> {
    const wallet = await this.walletService.getWallet(userId);
    if (wallet.balance < createDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const txnId = uuidv4();

    // Resolve operator name
    let operatorName = createDto.operatorId;
    try {
      const op = await this.operatorsService.findById(createDto.operatorId);
      if (op?.name) operatorName = op.name;
    } catch {}

    // STEP 1: Debit amount FIRST
    await this.walletService.deductBalance(
      userId,
      createDto.amount,
      `Recharge ₹${createDto.amount} for ${createDto.mobile}`,
      txnId,
    );
    await this.txnEvents.log(txnId, 'wallet_debit', `Debited ₹${createDto.amount} from wallet`, 'pending', { amount: createDto.amount });

    // Create transaction record
    const transaction = new this.rechargeModel({
      id: txnId,
      userId,
      operatorId: createDto.operatorId,
      operatorName,
      mobile: createDto.mobile,
      amount: createDto.amount,
      status: TransactionStatus.PENDING,
      circle: createDto.circle,
      isSandbox,
    });
    await transaction.save();
    await this.txnEvents.log(txnId, 'txn_created', `Transaction created for ${createDto.mobile} | ₹${createDto.amount} | ${operatorName}`, 'pending', { mobile: createDto.mobile, operator: operatorName });

    // STEP 2: Process via API
    let apiResult: {
      status: string;
      providerRef?: string;
      message: string;
      apiId?: string;
      apiRequest?: string;
      apiResponse?: string;
    } = { status: 'failed', message: 'No API available' };

    if (isSandbox) {
      apiResult = this.sandboxProcess();
      await this.txnEvents.log(txnId, 'api_call', `Sandbox API called → ${apiResult.status}`, apiResult.status, { sandbox: true });
    } else {
      const apiIds = await this.routingService.findBestAPIs(
        userRole,
        createDto.operatorId,
        createDto.amount,
      );
      await this.txnEvents.log(txnId, 'routing', `Routing resolved ${apiIds.length} API(s) for processing`, 'pending', { apiCount: apiIds.length });
      for (const apiId of apiIds) {
        try {
          await this.txnEvents.log(txnId, 'api_call', `Calling provider API: ${apiId}`, 'pending', { apiId });
          const result = await this.callProviderAPI(apiId, createDto, txnId);
          apiResult = { ...result, apiId };
          await this.txnEvents.log(txnId, 'api_response', `Provider responded: ${result.status} — ${result.message}`, result.status, { apiId, providerRef: result.providerRef });
          if (result.status === 'success' || result.status === 'pending') break;
        } catch (err) {
          apiResult = { status: 'failed', message: err.message, apiId };
          await this.txnEvents.log(txnId, 'api_error', `API ${apiId} error: ${err.message}`, 'failed', { apiId });
        }
      }
    }

    // Store API request/response
    transaction.apiRequest = apiResult.apiRequest || '';
    transaction.apiResponse = apiResult.apiResponse || '';

    // STEP 3: Handle result
    const commission = await this.commissionService.calculateCommission(
      userRole,
      createDto.operatorId,
      createDto.amount,
    );

    if (apiResult.status === 'success') {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.commission = commission;
      transaction.apiId = apiResult.apiId;
      transaction.providerRef = apiResult.providerRef;
      transaction.responseCode = '00';
      transaction.responseMessage = apiResult.message;
      if (commission > 0) {
        await this.walletService.addBalance(
          userId,
          commission,
          `Commission ₹${commission} for TXN ${txnId}`,
          txnId,
        );
        await this.txnEvents.log(txnId, 'commission_credit', `Commission ₹${commission} credited to wallet`, 'success', { commission });
      }
      await this.txnEvents.log(txnId, 'txn_success', `Transaction completed successfully | Ref: ${apiResult.providerRef}`, 'success');
    } else if (apiResult.status === 'pending') {
      transaction.status = TransactionStatus.PENDING;
      transaction.apiId = apiResult.apiId;
      transaction.providerRef = apiResult.providerRef;
      transaction.responseCode = 'TUP';
      transaction.responseMessage = apiResult.message;
      await this.txnEvents.log(txnId, 'txn_pending', `Transaction pending — awaiting provider confirmation`, 'pending');
    } else {
      // FAILED -> Refund full amount
      transaction.status = TransactionStatus.FAILED;
      transaction.apiId = apiResult.apiId;
      transaction.responseCode = '01';
      transaction.responseMessage = apiResult.message;
      transaction.refundAmount = createDto.amount;
      await this.walletService.addBalance(
        userId,
        createDto.amount,
        `Refund ₹${createDto.amount} for failed TXN ${txnId}`,
        txnId,
      );
      await this.txnEvents.log(txnId, 'refund', `Refunded ₹${createDto.amount} to wallet`, 'failed', { amount: createDto.amount });
      await this.txnEvents.log(txnId, 'txn_failed', `Transaction failed: ${apiResult.message}`, 'failed');
    }

    await transaction.save();
    const obj = transaction.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  /** Sandbox: random success/pending/failed */
  private sandboxProcess(): {
    status: string;
    providerRef?: string;
    message: string;
  } {
    const rand = Math.random();
    if (rand < 0.5) {
      return {
        status: 'success',
        providerRef: `SBX${Date.now()}`,
        message: 'Sandbox: Success',
      };
    } else if (rand < 0.75) {
      return {
        status: 'pending',
        providerRef: `SBX${Date.now()}`,
        message: 'Sandbox: Pending',
      };
    } else {
      return { status: 'failed', message: 'Sandbox: Failed' };
    }
  }

  /** Call actual provider API with full dynamic variable substitution */
  private async callProviderAPI(
    apiId: string,
    dto: CreateRechargeDto,
    txnId: string,
  ): Promise<{ status: string; providerRef?: string; message: string; apiRequest?: string; apiResponse?: string }> {
    try {
      const apiConfig = await this.apiConfigService.findById(apiId);
      const cfg = apiConfig.toObject();
      const vars = this.buildVarsMap(dto, txnId, cfg);

      // Substitute variables in endpoint URL
      const endpoint = this.substituteVars(cfg.endpoint, vars);
      const url = `${cfg.protocol}://${cfg.domain}${endpoint}`;

      // Build params with dynamic substitution
      const params: Record<string, string> = {};
      for (const p of cfg.parameters || []) {
        params[p.fieldName] = p.isDynamic
          ? this.substituteVars(p.fieldValue, vars)
          : p.fieldValue;
      }

      // Build headers
      const headers: Record<string, string> = {};
      for (const h of cfg.headers || []) {
        headers[h.key] = this.substituteVars(h.value, vars);
      }

      const apiRequest = JSON.stringify({ url, method: cfg.method, params, headers: Object.keys(headers) });

      let response: any;
      const method = cfg.method;
      const timeout = 30000;

      if (method === 'GET') {
        response = await axios.get(url, { params, headers, timeout });
      } else if (method === 'POST_JSON') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        response = await axios.post(url, params, { headers, timeout });
      } else if (method === 'POSTDATA') {
        headers['Content-Type'] =
          headers['Content-Type'] || 'application/x-www-form-urlencoded';
        const formBody = new URLSearchParams(params).toString();
        response = await axios.post(url, formBody, { headers, timeout });
      } else {
        // Default POST
        response = await axios.post(url, params, { headers, timeout });
      }

      const apiResponse = JSON.stringify(response.data);
      const parsed = this.parseProviderResponse(cfg, response.data);
      return { ...parsed, apiRequest, apiResponse };
    } catch (err) {
      return { status: 'failed', message: `API Error: ${err.message}`, apiRequest: '', apiResponse: '' };
    }
  }

  /** Parse provider response using configured field mappings */
  private parseProviderResponse(
    cfg: any,
    data: any,
  ): { status: string; providerRef?: string; message: string } {
    const statusField = cfg.successField || 'status';

    // Support nested paths like "data.status" using dot notation
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((o, k) => o?.[k], obj);
    };

    const statusVal = getNestedValue(data, statusField);
    const providerRef =
      getNestedValue(data, cfg.txnIdField || 'txnid') || `P${Date.now()}`;
    const message =
      getNestedValue(data, cfg.messageField || 'status_msg') || '';

    // Check against response mappings first
    if (cfg.responseMappings?.length) {
      for (const mapping of cfg.responseMappings) {
        if (
          String(statusVal) === String(mapping.errorCode) ||
          String(statusVal) === String(mapping.keyMessage)
        ) {
          const mappedStatus = (mapping.status || mapping.responseType || '')
            .toLowerCase();
          if (mappedStatus === 'success') {
            return { status: 'success', providerRef, message };
          } else if (mappedStatus === 'pending') {
            return { status: 'pending', providerRef, message };
          } else {
            return { status: 'failed', message: message || 'Failed' };
          }
        }
      }
    }

    // Fallback to simple value matching
    if (String(statusVal) === String(cfg.successValue || 'Success')) {
      return { status: 'success', providerRef, message: message || 'Success' };
    } else if (String(statusVal) === String(cfg.pendingValue || 'Pending')) {
      return { status: 'pending', providerRef, message: message || 'Pending' };
    } else {
      return { status: 'failed', message: message || 'Failed' };
    }
  }

  /** Retry failed: refund was already done, so debit again, process, handle result */
  async retryFailedTransaction(txnId: string): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId });
    if (!transaction) throw new BadRequestException('Transaction not found');
    if (transaction.status !== TransactionStatus.FAILED)
      throw new BadRequestException('Only failed transactions can be retried');

    return this.createRecharge(
      transaction.userId,
      UserRole.RETAILER,
      {
        operatorId: transaction.operatorId,
        mobile: transaction.mobile,
        amount: transaction.amount,
        circle: transaction.circle,
      },
      transaction.isSandbox,
    );
  }

  /** Check status of pending transaction via provider API */
  async checkPendingStatus(txnId: string): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId });
    if (!transaction) throw new BadRequestException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING) {
      const obj = transaction.toObject();
      delete obj._id;
      delete obj.__v;
      return obj;
    }

    if (transaction.isSandbox) {
      await this.txnEvents.log(txnId, 'status_check', 'Status check initiated (sandbox)', 'pending');
      await this.resolveSandboxStatus(transaction, txnId);
    } else if (transaction.apiId) {
      await this.txnEvents.log(txnId, 'status_check', 'Status check initiated via provider API', 'pending');
      await this.resolveRealStatus(transaction, txnId);
    }

    const obj = transaction.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  /** Sandbox status check - randomly resolves */
  private async resolveSandboxStatus(
    transaction: any,
    txnId: string,
  ): Promise<void> {
    const rand = Math.random();
    if (rand < 0.6) {
      const commission =
        await this.commissionService.calculateCommission(
          UserRole.RETAILER,
          transaction.operatorId,
          transaction.amount,
        );
      transaction.status = TransactionStatus.SUCCESS;
      transaction.commission = commission;
      transaction.responseCode = '00';
      transaction.responseMessage = 'Sandbox: Resolved as Success';
      if (commission > 0) {
        await this.walletService.addBalance(
          transaction.userId,
          commission,
          `Commission ₹${commission} for TXN ${txnId}`,
          txnId,
        );
      }
      await this.txnEvents.log(txnId, 'status_resolved', 'Sandbox status check → Success', 'success');
    } else if (rand < 0.8) {
      // Still pending - no change
      await this.txnEvents.log(txnId, 'status_still_pending', 'Sandbox status check → Still Pending', 'pending');
    } else {
      transaction.status = TransactionStatus.FAILED;
      transaction.responseCode = '01';
      transaction.responseMessage = 'Sandbox: Resolved as Failed';
      transaction.refundAmount = transaction.amount;
      await this.walletService.addBalance(
        transaction.userId,
        transaction.amount,
        `Refund ₹${transaction.amount} for failed TXN ${txnId}`,
        txnId,
      );
      await this.txnEvents.log(txnId, 'status_resolved', `Sandbox status check → Failed | Refunded ₹${transaction.amount}`, 'failed');
    }
    await transaction.save();
  }

  /** Real provider status check with full variable substitution */
  private async resolveRealStatus(
    transaction: any,
    txnId: string,
  ): Promise<void> {
    try {
      const apiConfig = await this.apiConfigService.findById(transaction.apiId);
      const cfg = apiConfig.toObject();
      if (!cfg.statusCheckEndpoint) return;

      const vars = this.buildVarsMap(
        {
          mobile: transaction.mobile,
          operatorId: transaction.operatorId,
          amount: transaction.amount,
          circle: transaction.circle,
        },
        txnId,
        cfg,
      );
      // Also add provider ref
      vars['provider_ref'] = transaction.providerRef || '';

      const checkEndpoint = this.substituteVars(
        cfg.statusCheckEndpoint,
        vars,
      );
      const checkUrl = `${cfg.protocol}://${cfg.domain}${checkEndpoint}`;

      // Build status check params
      const checkParams: Record<string, string> = {};
      for (const p of cfg.statusCheckParams || []) {
        checkParams[p.fieldName] = p.isDynamic
          ? this.substituteVars(p.fieldValue, vars)
          : p.fieldValue;
      }

      // Build headers
      const headers: Record<string, string> = {};
      for (const h of cfg.headers || []) {
        headers[h.key] = this.substituteVars(h.value, vars);
      }

      let response: any;
      const method = (cfg.statusCheckMethod || 'GET').toUpperCase();
      const timeout = 30000;

      if (method === 'GET') {
        response = await axios.get(checkUrl, {
          params: checkParams,
          headers,
          timeout,
        });
      } else if (method === 'POST_JSON') {
        headers['Content-Type'] =
          headers['Content-Type'] || 'application/json';
        response = await axios.post(checkUrl, checkParams, {
          headers,
          timeout,
        });
      } else if (method === 'POSTDATA') {
        headers['Content-Type'] =
          headers['Content-Type'] || 'application/x-www-form-urlencoded';
        const formBody = new URLSearchParams(checkParams).toString();
        response = await axios.post(checkUrl, formBody, {
          headers,
          timeout,
        });
      } else {
        response = await axios.post(checkUrl, checkParams, {
          headers,
          timeout,
        });
      }

      const parsed = this.parseProviderResponse(cfg, response.data);

      if (parsed.status === 'success') {
        const commission =
          await this.commissionService.calculateCommission(
            UserRole.RETAILER,
            transaction.operatorId,
            transaction.amount,
          );
        transaction.status = TransactionStatus.SUCCESS;
        transaction.commission = commission;
        transaction.providerRef = parsed.providerRef;
        transaction.responseCode = '00';
        transaction.responseMessage = parsed.message || 'Success';
        if (commission > 0) {
          await this.walletService.addBalance(
            transaction.userId,
            commission,
            `Commission ₹${commission} for TXN ${txnId}`,
            txnId,
          );
        }
      } else if (parsed.status === 'failed') {
        transaction.status = TransactionStatus.FAILED;
        transaction.responseCode = '01';
        transaction.responseMessage = parsed.message || 'Failed';
        transaction.refundAmount = transaction.amount;
        await this.walletService.addBalance(
          transaction.userId,
          transaction.amount,
          `Refund ₹${transaction.amount} for failed TXN ${txnId}`,
          txnId,
        );
      }
      // If still pending, no change
      await transaction.save();
    } catch (err) {
      // Status check failed, keep pending
    }
  }

  private async enrichWithUserNames(transactions: any[]): Promise<any[]> {
    const userIds = [...new Set(transactions.map((t) => t.userId))];
    const userMap: Record<string, string> = {};
    for (const uid of userIds) {
      try {
        const user = await this.usersService.findById(uid);
        userMap[uid] = user?.name || uid;
      } catch {
        userMap[uid] = uid;
      }
    }
    return transactions.map((t) => {
      const obj = typeof t.toObject === 'function' ? t.toObject() : { ...t };
      delete obj._id;
      delete obj.__v;
      return { ...obj, userName: userMap[obj.userId] || obj.userId };
    });
  }

  async getTransactions(userId: string, limit = 100): Promise<any[]> {
    const txns = await this.rechargeModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return txns.map((t) => {
      const o = { ...t } as any;
      delete o._id;
      delete o.__v;
      return o;
    });
  }

  async getAllTransactions(limit = 1000): Promise<any[]> {
    const txns = await this.rechargeModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return this.enrichWithUserNames(txns);
  }

  async getTransactionById(id: string): Promise<any> {
    return this.rechargeModel.findOne({ id }).select('-_id -__v');
  }

  async getStats(): Promise<any> {
    const totalTransactions = await this.rechargeModel.countDocuments();
    const successTransactions = await this.rechargeModel.countDocuments({
      status: TransactionStatus.SUCCESS,
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = await this.rechargeModel.countDocuments({
      createdAt: { $gte: today },
    });
    const volumeResult = await this.rechargeModel.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayVolumeResult = await this.rechargeModel.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingCount = await this.rechargeModel.countDocuments({
      status: TransactionStatus.PENDING,
    });
    const successRate =
      totalTransactions > 0
        ? (successTransactions / totalTransactions) * 100
        : 0;
    return {
      totalTransactions,
      totalVolume: volumeResult[0]?.total || 0,
      todayTransactions,
      todayVolume: todayVolumeResult[0]?.total || 0,
      pendingRecharges: pendingCount,
      successRate: successRate.toFixed(2),
    };
  }

  async getFailedTransactions(limit = 100): Promise<any[]> {
    const txns = await this.rechargeModel
      .find({ status: TransactionStatus.FAILED })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return this.enrichWithUserNames(txns);
  }

  async getPendingTransactions(limit = 100): Promise<any[]> {
    const txns = await this.rechargeModel
      .find({ status: TransactionStatus.PENDING })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return this.enrichWithUserNames(txns);
  }

  /** Sandbox bulk test */
  async sandboxBulkTest(
    userId: string,
    count: number,
    operators: string[],
    tpm: number,
  ): Promise<any> {
    const results = {
      total: count,
      success: 0,
      failed: 0,
      pending: 0,
      errors: 0,
      totalDebited: 0,
      totalCommission: 0,
      totalRefunded: 0,
    };
    const delay = tpm > 0 ? Math.floor(60000 / tpm) : 0;

    for (let i = 0; i < count; i++) {
      const opId = operators[i % operators.length];
      const amount = [99, 149, 199, 249, 299][
        Math.floor(Math.random() * 5)
      ];
      const mobile = `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      try {
        const txn = await this.createRecharge(
          userId,
          UserRole.RETAILER,
          { operatorId: opId, mobile, amount },
          true,
        );
        results.totalDebited += amount;
        if (txn.status === 'success') {
          results.success++;
          results.totalCommission += txn.commission || 0;
        } else if (txn.status === 'pending') {
          results.pending++;
        } else {
          results.failed++;
          results.totalRefunded += txn.refundAmount || 0;
        }
      } catch (err) {
        results.errors++;
        if (err.message?.includes('Insufficient balance')) break;
      }
      if (delay > 0 && i < count - 1)
        await new Promise((r) => setTimeout(r, Math.min(delay, 100)));
    }
    return results;
  }

  /** Admin manually changes transaction status */
  async adminChangeStatus(
    txnId: string,
    newStatus: string,
    adminNote: string,
    adminId: string,
  ): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId });
    if (!transaction) throw new BadRequestException('Transaction not found');

    const oldStatus = transaction.status;

    // Handle wallet changes based on status transition
    if (oldStatus === TransactionStatus.PENDING && newStatus === 'success') {
      const commission = await this.commissionService.calculateCommission(
        UserRole.RETAILER, transaction.operatorId, transaction.amount,
      );
      transaction.commission = commission;
      if (commission > 0) {
        await this.walletService.addBalance(
          transaction.userId, commission,
          `Commission ₹${commission} for TXN ${txnId} (admin)`, txnId,
        );
      }
    } else if (oldStatus === TransactionStatus.PENDING && newStatus === 'failed') {
      transaction.refundAmount = transaction.amount;
      await this.walletService.addBalance(
        transaction.userId, transaction.amount,
        `Refund ₹${transaction.amount} for failed TXN ${txnId} (admin)`, txnId,
      );
    } else if (oldStatus === TransactionStatus.DISPUTE && newStatus === 'success') {
      // Dispute resolved as success — original was failed so user already got refund
      // Now debit the refund back and credit commission
      await this.walletService.deductBalance(
        transaction.userId, transaction.amount,
        `Debit ₹${transaction.amount} - dispute resolved as success for TXN ${txnId}`, txnId,
      );
      const commission = await this.commissionService.calculateCommission(
        UserRole.RETAILER, transaction.operatorId, transaction.amount,
      );
      transaction.commission = commission;
      if (commission > 0) {
        await this.walletService.addBalance(
          transaction.userId, commission,
          `Commission ₹${commission} for TXN ${txnId} (dispute resolved)`, txnId,
        );
      }
    }
    // dispute resolved as failed → no wallet change (refund was already done)

    transaction.status = newStatus as TransactionStatus;
    transaction.responseMessage = `${adminNote || ''} [Admin changed: ${oldStatus} → ${newStatus}]`;
    await transaction.save();
    await this.txnEvents.log(txnId, 'admin_status_change', `Admin changed status: ${oldStatus} → ${newStatus} | Note: ${adminNote || 'N/A'}`, newStatus, { oldStatus, newStatus, adminId });

    const obj = transaction.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  /** Bulk resolve all pending transactions */
  async bulkResolveStatus(): Promise<any> {
    const pendingTxns = await this.rechargeModel.find({ status: TransactionStatus.PENDING });
    const results = { total: pendingTxns.length, resolved: 0, stillPending: 0, failed: 0 };

    for (const txn of pendingTxns) {
      try {
        const result = await this.checkPendingStatus(txn.id);
        if (result.status === TransactionStatus.SUCCESS) results.resolved++;
        else if (result.status === TransactionStatus.FAILED) results.failed++;
        else results.stillPending++;
      } catch {
        results.stillPending++;
      }
    }
    return results;
  }

  /** Get transaction detail with API request/response for retry popup */
  async getTransactionDetail(txnId: string): Promise<any> {
    const txn = await this.rechargeModel.findOne({ id: txnId }).lean();
    if (!txn) throw new BadRequestException('Transaction not found');

    const obj = { ...txn } as any;
    delete obj._id;
    delete obj.__v;

    // Get available APIs for retry
    let availableApis = [];
    try {
      const apis = await this.apiConfigService.findAll();
      availableApis = apis.map((a: any) => {
        const ao = typeof a.toObject === 'function' ? a.toObject() : a;
        return { id: ao.id, name: ao.name, apiType: ao.apiType, isActive: ao.isActive };
      });
    } catch {}

    return { ...obj, availableApis };
  }

  /** Retry with specific API */
  async retryWithApi(txnId: string, apiId: string): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: txnId });
    if (!transaction) throw new BadRequestException('Transaction not found');
    if (transaction.status !== TransactionStatus.FAILED && transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Can only retry failed or pending transactions');
    }

    // Create new transaction (debit-first flow)
    return this.createRecharge(
      transaction.userId,
      UserRole.RETAILER,
      {
        operatorId: transaction.operatorId,
        mobile: transaction.mobile,
        amount: transaction.amount,
        circle: transaction.circle,
      },
      transaction.isSandbox,
    );
  }
}
