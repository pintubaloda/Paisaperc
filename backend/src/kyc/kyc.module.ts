import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KYCDocument, KYCDocumentSchema } from './kyc.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: KYCDocument.name, schema: KYCDocumentSchema }])],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
