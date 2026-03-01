import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RechargeController } from './recharge.controller';
import { RechargeService } from './recharge.service';
import { RechargeTransaction, RechargeTransactionSchema } from './recharge.schema';
import { WalletModule } from '../wallet/wallet.module';
import { CommissionModule } from '../commission/commission.module';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RechargeTransaction.name, schema: RechargeTransactionSchema }]),
    WalletModule,
    CommissionModule,
    RoutingModule,
  ],
  controllers: [RechargeController],
  providers: [RechargeService],
  exports: [RechargeService],
})
export class RechargeModule {}
