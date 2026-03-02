import { Module } from '@nestjs/common';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService],
})
export class PaymentRequestsModule {}
