import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentRequestDto, UpdatePaymentRequestDto } from './payment-request.dto';
import { WalletService } from '../wallet/wallet.service';
import { PaymentRequestStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentRequestsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async create(userId: string, createDto: CreatePaymentRequestDto, proofUrl?: string): Promise<any> {
    return this.prisma.paymentRequest.create({
      data: {
        userId,
        ...createDto,
        proofUrl,
        status: PaymentRequestStatus.PENDING as any,
      },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.paymentRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findByUserId(userId: string): Promise<any[]> {
    return this.prisma.paymentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateDto: UpdatePaymentRequestDto): Promise<any> {
    const request = await this.prisma.paymentRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    const updated = await this.prisma.paymentRequest.update({
      where: { id },
      data: {
        status: updateDto.status as any,
        adminRemarks: updateDto.adminRemarks || request.adminRemarks,
      },
    });

    if (
      updateDto.status === PaymentRequestStatus.APPROVED &&
      request.status !== (PaymentRequestStatus.APPROVED as any)
    ) {
      await this.walletService.addBalance(
        request.userId,
        request.amount,
        `Payment request ${id} approved`,
        id,
      );
    }

    return updated;
  }
}
