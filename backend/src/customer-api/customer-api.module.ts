import { Module } from '@nestjs/common';
import { CustomerApiController } from './customer-api.controller';
import { RechargeModule } from '../recharge/recharge.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [RechargeModule, UsersModule],
  controllers: [CustomerApiController],
})
export class CustomerApiModule {}
