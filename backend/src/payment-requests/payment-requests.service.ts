import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentRequest } from './payment-request.schema';
import { CreatePaymentRequestDto, UpdatePaymentRequestDto } from './payment-request.dto';
import { WalletService } from '../wallet/wallet.service';
import { PaymentRequestStatus } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentRequestsService {
  constructor(
    @InjectModel(PaymentRequest.name) private paymentRequestModel: Model<PaymentRequest>,
    private walletService: WalletService,
  ) {}

  async create(userId: string, createDto: CreatePaymentRequestDto, proofUrl?: string): Promise<any> {
    const request = new this.paymentRequestModel({
      id: uuidv4(),
      userId,
      ...createDto,
      proofUrl,
      status: PaymentRequestStatus.PENDING,
    });
    await request.save();
    const obj = request.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findAll(): Promise<any[]> {
    return this.paymentRequestModel.find().sort({ createdAt: -1 }).select('-_id -__v');
  }

  async findByUserId(userId: string): Promise<any[]> {
    return this.paymentRequestModel.find({ userId }).sort({ createdAt: -1 }).select('-_id -__v');
  }

  async update(id: string, updateDto: UpdatePaymentRequestDto): Promise<any> {
    const request = await this.paymentRequestModel.findOne({ id });
    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    request.status = updateDto.status;
    request.adminRemarks = updateDto.adminRemarks || request.adminRemarks;
    await request.save();

    if (updateDto.status === PaymentRequestStatus.APPROVED) {
      await this.walletService.addBalance(
        request.userId,
        request.amount,
        `Payment request ${id} approved`,
        id,
      );
    }

    const obj = request.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }
}
