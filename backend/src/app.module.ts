import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { OperatorsModule } from './operators/operators.module';
import { ApiConfigModule } from './api-config/api-config.module';
import { CommissionModule } from './commission/commission.module';
import { RoutingModule } from './routing/routing.module';
import { RechargeModule } from './recharge/recharge.module';
import { PaymentRequestsModule } from './payment-requests/payment-requests.module';
import { ReportsModule } from './reports/reports.module';
import { CustomerApiModule } from './customer-api/customer-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME,
    }),
    AuthModule,
    UsersModule,
    WalletModule,
    OperatorsModule,
    ApiConfigModule,
    CommissionModule,
    RoutingModule,
    RechargeModule,
    PaymentRequestsModule,
    ReportsModule,
    CustomerApiModule,
  ],
})
export class AppModule {}
