import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WalletModule } from '../wallet/wallet.module';
import { CommissionModule } from '../commission/commission.module';
import { ApiConfigModule } from '../api-config/api-config.module';
import { DisputeModule } from '../dispute/dispute.module';
import { RechargeModule } from '../recharge/recharge.module';

@Module({
  imports: [
    WalletModule,
    CommissionModule,
    ApiConfigModule,
    DisputeModule,
    RechargeModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
