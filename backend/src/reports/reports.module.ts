import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { RechargeModule } from '../recharge/recharge.module';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [RechargeModule, WalletModule, UsersModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
