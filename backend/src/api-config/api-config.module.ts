import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiConfigController } from './api-config.controller';
import { ApiConfigService } from './api-config.service';
import { APIMaster, APIMasterSchema } from './api-master.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: APIMaster.name, schema: APIMasterSchema }])],
  controllers: [ApiConfigController],
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class ApiConfigModule {}
