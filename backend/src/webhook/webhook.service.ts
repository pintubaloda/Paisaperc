import { Injectable, NotFoundException } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';
import { DisputeService } from '../dispute/dispute.service';
import { TxnEventService } from '../recharge/txn-event.service';
import { TransactionStatus, UserRole } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private commissionService: CommissionService,
    private disputeService: DisputeService,
    private txnEvents: TxnEventService,
  ) {}

  async processWebhook(
    apiId: string,
    callbackToken: string,
    data: { txnId: string; status: string; providerRef?: string; message?: string },
  ): Promise<any> {
    const transaction = await this.prisma.rechargeTransaction.findUnique({ where: { id: data.txnId } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const incomingStatus = data.status?.toLowerCase();

    await this.txnEvents.log(
      data.txnId,
      'webhook_received',
      `Webhook received: status=${incomingStatus}, ref=${data.providerRef || 'N/A'}`,
      transaction.status,
      { webhookData: data },
    );

    if (transaction.status === (TransactionStatus.FAILED as any) && incomingStatus === 'success') {
      await this.disputeService.create({
        txnId: transaction.id,
        userId: transaction.userId,
        operatorName: transaction.operatorName || transaction.operatorId,
        mobile: transaction.mobile,
        amount: transaction.amount,
        originalStatus: transaction.status,
        webhookStatus: incomingStatus,
        webhookData: data,
      });

      await this.prisma.rechargeTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.DISPUTE as any,
          responseMessage: 'Dispute: was failed, webhook says success',
        },
      });

      await this.txnEvents.log(
        data.txnId,
        'dispute_created',
        'DISPUTE: Transaction was failed but webhook says success — escalated for admin review',
        'dispute',
      );

      return { status: 'dispute_created', txnId: transaction.id };
    }

    if (transaction.status === (TransactionStatus.PENDING as any) && incomingStatus === 'success') {
      const commission = await this.commissionService.calculateCommission(
        UserRole.RETAILER,
        transaction.operatorId,
        transaction.amount,
      );

      if (commission > 0) {
        await this.walletService.addBalance(
          transaction.userId,
          commission,
          `Commission ₹${commission} for TXN ${transaction.id}`,
          transaction.id,
        );
      }

      await this.prisma.rechargeTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.SUCCESS as any,
          commission,
          providerRef: data.providerRef || transaction.providerRef,
          responseCode: '00',
          responseMessage: data.message || 'Success via webhook',
        },
      });

      return { status: 'updated', newStatus: 'success', txnId: transaction.id };
    }

    if (transaction.status === (TransactionStatus.PENDING as any) && incomingStatus === 'failed') {
      await this.walletService.addBalance(
        transaction.userId,
        transaction.amount,
        `Refund ₹${transaction.amount} for failed TXN ${transaction.id}`,
        transaction.id,
      );

      await this.prisma.rechargeTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED as any,
          responseCode: '01',
          responseMessage: data.message || 'Failed via webhook',
          refundAmount: transaction.amount,
        },
      });

      return { status: 'updated', newStatus: 'failed', txnId: transaction.id };
    }

    if (transaction.status === (TransactionStatus.SUCCESS as any) && incomingStatus === 'success') {
      await this.prisma.rechargeTransaction.update({
        where: { id: transaction.id },
        data: {
          ...(data.providerRef ? { providerRef: data.providerRef } : {}),
          ...(data.message ? { responseMessage: data.message } : {}),
        },
      });
      return { status: 'ref_updated', txnId: transaction.id };
    }

    return {
      status: 'no_action',
      currentStatus: transaction.status,
      webhookStatus: incomingStatus,
    };
  }
}
