import { Module } from '@nestjs/common';
import { ApiConfigController } from './api-config.controller';
import { ApiConfigService } from './api-config.service';

@Module({
  imports: [],
  controllers: [ApiConfigController],
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class ApiConfigModule {}
