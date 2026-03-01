import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { OperatorsModule } from './operators/operators.module';
import { ApiConfigModule } from './api-config/api-config.module';
import { CommissionModule } from './commission/commission.module';
import { RoutingModule } from './routing/routing.module';
import { RechargeModule } from './recharge/recharge.module';
import { CustomerApiModule } from './customer-api/customer-api.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { DisputeModule } from './dispute/dispute.module';
import { WebhookModule } from './webhook/webhook.module';
import { KycModule } from './kyc/kyc.module';
import { GatewayModule } from './gateway/gateway.module';
import { QueueModule } from './queue/queue.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ReportsModule } from './reports/reports.module';
import { OperatorAPIMappingModule } from './operator-api-mapping/operator-api-mapping.module';
import { PaymentRequestsModule } from './payment-requests/payment-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL, { dbName: process.env.DB_NAME }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    WalletModule,
    OperatorsModule,
    ApiConfigModule,
    CommissionModule,
    RoutingModule,
    RechargeModule,
    CustomerApiModule,
    TwoFactorModule,
    DisputeModule,
    WebhookModule,
    KycModule,
    GatewayModule,
    QueueModule,
    ReconciliationModule,
    ReportsModule,
    OperatorAPIMappingModule,
    PaymentRequestsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
