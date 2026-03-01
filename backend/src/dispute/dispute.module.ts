import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { Dispute, DisputeSchema } from './dispute.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Dispute.name, schema: DisputeSchema }])],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
