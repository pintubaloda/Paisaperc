import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorAuth, TwoFactorAuthSchema } from './two-factor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TwoFactorAuth.name, schema: TwoFactorAuthSchema }]),
  ],
  controllers: [TwoFactorController],
  providers: [TwoFactorService],
  exports: [TwoFactorService],
})
export class TwoFactorModule {}
