import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueService } from './queue.service';
import { QueueJob, QueueJobSchema } from './queue.schema';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: QueueJob.name, schema: QueueJobSchema }])],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
