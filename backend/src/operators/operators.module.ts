import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';
import { Operator, OperatorSchema } from './operator.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Operator.name, schema: OperatorSchema }])],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
