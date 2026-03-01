import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RechargeTransaction } from '../recharge/recharge.schema';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';
import { DisputeService } from '../dispute/dispute.service';
import { TxnEventService } from '../recharge/txn-event.service';
import { TransactionStatus, UserRole } from '../common/enums';

@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(RechargeTransaction.name) private rechargeModel: Model<RechargeTransaction>,
    private walletService: WalletService,
    private commissionService: CommissionService,
    private disputeService: DisputeService,
    private txnEvents: TxnEventService,
  ) {}

  /**
   * Process webhook from provider
   * Rules:
   * - pending txn → success/failed: update normally
   * - success txn → update provider ref only
   * - failed txn + success webhook → create DISPUTE (admin decides)
   */
  async processWebhook(
    apiId: string,
    callbackToken: string,
    data: { txnId: string; status: string; providerRef?: string; message?: string },
  ): Promise<any> {
    const transaction = await this.rechargeModel.findOne({ id: data.txnId });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const incomingStatus = data.status?.toLowerCase();
    await this.txnEvents.log(data.txnId, 'webhook_received', `Webhook received: status=${incomingStatus}, ref=${data.providerRef || 'N/A'}`, transaction.status, { webhookData: data });

    // Failed txn receiving success webhook → DISPUTE
    if (transaction.status === TransactionStatus.FAILED && incomingStatus === 'success') {
      await this.disputeService.create({
        txnId: transaction.id,
        userId: transaction.userId,
        operatorName: (transaction as any).operatorName || transaction.operatorId,
        mobile: transaction.mobile,
        amount: transaction.amount,
        originalStatus: transaction.status,
        webhookStatus: incomingStatus,
        webhookData: data,
      });
      transaction.status = TransactionStatus.DISPUTE;
      transaction.responseMessage = `Dispute: was failed, webhook says success`;
      await transaction.save();
      return { status: 'dispute_created', txnId: transaction.id };
    }

    // Pending → Success
    if (transaction.status === TransactionStatus.PENDING && incomingStatus === 'success') {
      const commission = await this.commissionService.calculateCommission(
        UserRole.RETAILER, transaction.operatorId, transaction.amount,
      );
      transaction.status = TransactionStatus.SUCCESS;
      transaction.commission = commission;
      transaction.providerRef = data.providerRef || transaction.providerRef;
      transaction.responseCode = '00';
      transaction.responseMessage = data.message || 'Success via webhook';
      if (commission > 0) {
        await this.walletService.addBalance(
          transaction.userId, commission,
          `Commission ₹${commission} for TXN ${transaction.id}`, transaction.id,
        );
      }
      await transaction.save();
      return { status: 'updated', newStatus: 'success', txnId: transaction.id };
    }

    // Pending → Failed
    if (transaction.status === TransactionStatus.PENDING && incomingStatus === 'failed') {
      transaction.status = TransactionStatus.FAILED;
      transaction.responseCode = '01';
      transaction.responseMessage = data.message || 'Failed via webhook';
      transaction.refundAmount = transaction.amount;
      await this.walletService.addBalance(
        transaction.userId, transaction.amount,
        `Refund ₹${transaction.amount} for failed TXN ${transaction.id}`, transaction.id,
      );
      await transaction.save();
      return { status: 'updated', newStatus: 'failed', txnId: transaction.id };
    }

    // Success → update ref only
    if (transaction.status === TransactionStatus.SUCCESS && incomingStatus === 'success') {
      if (data.providerRef) transaction.providerRef = data.providerRef;
      if (data.message) transaction.responseMessage = data.message;
      await transaction.save();
      return { status: 'ref_updated', txnId: transaction.id };
    }

    return { status: 'no_action', currentStatus: transaction.status, webhookStatus: incomingStatus };
  }
}
