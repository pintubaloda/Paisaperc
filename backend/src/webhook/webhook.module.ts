import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { RechargeTransaction, RechargeTransactionSchema } from '../recharge/recharge.schema';
import { WalletModule } from '../wallet/wallet.module';
import { CommissionModule } from '../commission/commission.module';
import { ApiConfigModule } from '../api-config/api-config.module';
import { DisputeModule } from '../dispute/dispute.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RechargeTransaction.name, schema: RechargeTransactionSchema }]),
    WalletModule,
    CommissionModule,
    ApiConfigModule,
    DisputeModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
