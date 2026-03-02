import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
