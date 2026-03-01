import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatorAPIMappingController } from './operator-api-mapping.controller';
import { OperatorAPIMappingService } from './operator-api-mapping.service';
import { OperatorAPIMapping, OperatorAPIMappingSchema } from './operator-api-mapping.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OperatorAPIMapping.name, schema: OperatorAPIMappingSchema }]),
  ],
  controllers: [OperatorAPIMappingController],
  providers: [OperatorAPIMappingService],
  exports: [OperatorAPIMappingService],
})
export class OperatorAPIMappingModule {}
