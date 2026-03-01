import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RechargeController } from './recharge.controller';
import { RechargeService } from './recharge.service';
import { RechargeTransaction, RechargeTransactionSchema } from './recharge.schema';
import { WalletModule } from '../wallet/wallet.module';
import { CommissionModule } from '../commission/commission.module';
import { RoutingModule } from '../routing/routing.module';
import { ApiConfigModule } from '../api-config/api-config.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RechargeTransaction.name, schema: RechargeTransactionSchema }]),
    WalletModule,
    CommissionModule,
    RoutingModule,
    ApiConfigModule,
  ],
  controllers: [RechargeController],
  providers: [RechargeService],
  exports: [RechargeService],
})
export class RechargeModule {}
