import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import { PaymentRequest, PaymentRequestSchema } from './payment-request.schema';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentRequest.name, schema: PaymentRequestSchema }]),
    WalletModule,
  ],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService],
})
export class PaymentRequestsModule {}
