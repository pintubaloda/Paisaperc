import { Module } from '@nestjs/common';
import { OperatorAPIMappingController } from './operator-api-mapping.controller';
import { OperatorAPIMappingService } from './operator-api-mapping.service';

@Module({
  imports: [],
  controllers: [OperatorAPIMappingController],
  providers: [OperatorAPIMappingService],
  exports: [OperatorAPIMappingService],
})
export class OperatorAPIMappingModule {}
