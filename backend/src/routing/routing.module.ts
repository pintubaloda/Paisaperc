import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';
import { RoutingRule, RoutingRuleSchema } from './routing.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: RoutingRule.name, schema: RoutingRuleSchema }])],
  controllers: [RoutingController],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
