import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import { RechargeTransaction, RechargeTransactionSchema } from '../recharge/recharge.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: RechargeTransaction.name, schema: RechargeTransactionSchema }])],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
