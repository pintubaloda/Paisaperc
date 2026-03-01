import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TwoFactorAuth } from './two-factor.schema';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectModel(TwoFactorAuth.name) private twoFactorModel: Model<TwoFactorAuth>,
  ) {}

  async enable2FA(userId: string): Promise<any> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    let twoFactor = await this.twoFactorModel.findOne({ userId });
    
    if (twoFactor) {
      twoFactor.isEnabled = true;
      twoFactor.secret = secret;
      twoFactor.backupCodes = backupCodes;
      await twoFactor.save();
    } else {
      twoFactor = new this.twoFactorModel({
        id: uuidv4(),
        userId,
        isEnabled: true,
        secret,
        backupCodes,
      });
      await twoFactor.save();
    }

    return {
      secret,
      backupCodes,
      qrCodeUrl: this.generateQRCodeUrl(secret),
    };
  }

  async disable2FA(userId: string): Promise<void> {
    await this.twoFactorModel.updateOne({ userId }, { isEnabled: false });
  }

  async verify2FA(userId: string, code: string): Promise<boolean> {
    const twoFactor = await this.twoFactorModel.findOne({ userId, isEnabled: true });
    if (!twoFactor) return false;

    // Mock verification - in production use speakeasy or similar
    const isValid = code === this.generateMockOTP(twoFactor.secret);
    
    // Check backup codes
    if (!isValid && twoFactor.backupCodes.includes(code)) {
      twoFactor.backupCodes = twoFactor.backupCodes.filter(c => c !== code);
      await twoFactor.save();
      return true;
    }

    return isValid;
  }

  async getStatus(userId: string): Promise<any> {
    const twoFactor = await this.twoFactorModel.findOne({ userId }).select('-_id -__v -secret');
    return twoFactor || { isEnabled: false };
  }

  private generateSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
  }

  private generateQRCodeUrl(secret: string): string {
    return `otpauth://totp/PaisaPe?secret=${secret}`;
  }

  private generateMockOTP(secret: string): string {
    // Mock OTP generation - returns last 6 chars of secret
    return secret.slice(-6);
  }
}
