import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RechargeController } from './recharge.controller';
import { RechargeService } from './recharge.service';
import { RechargeTransaction, RechargeTransactionSchema } from './recharge.schema';
import { TxnEvent, TxnEventSchema } from './txn-event.schema';
import { TxnEventService } from './txn-event.service';
import { WalletModule } from '../wallet/wallet.module';
import { CommissionModule } from '../commission/commission.module';
import { RoutingModule } from '../routing/routing.module';
import { ApiConfigModule } from '../api-config/api-config.module';
import { UsersModule } from '../users/users.module';
import { OperatorsModule } from '../operators/operators.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RechargeTransaction.name, schema: RechargeTransactionSchema },
      { name: TxnEvent.name, schema: TxnEventSchema },
    ]),
    WalletModule,
    CommissionModule,
    RoutingModule,
    ApiConfigModule,
    OperatorsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [RechargeController],
  providers: [RechargeService, TxnEventService],
  exports: [RechargeService, TxnEventService],
})
export class RechargeModule {}
