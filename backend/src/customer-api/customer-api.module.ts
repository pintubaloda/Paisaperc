import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CustomerApiController } from './customer-api.controller';
import { RechargeModule } from '../recharge/recharge.module';
import { UsersModule } from '../users/users.module';
import { EncryptionMiddleware } from '../common/encryption.middleware';

@Module({
  imports: [RechargeModule, UsersModule],
  controllers: [CustomerApiController],
})
export class CustomerApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EncryptionMiddleware).forRoutes('customer-api');
  }
}
