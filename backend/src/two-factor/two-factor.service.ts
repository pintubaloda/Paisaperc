import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TwoFactorAuth } from './two-factor.schema';
import { v4 as uuidv4 } from 'uuid';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectModel(TwoFactorAuth.name) private twoFactorModel: Model<TwoFactorAuth>,
  ) {}

  async enable2FA(userId: string): Promise<any> {
    const secret = speakeasy.generateSecret({
      name: 'PaisaPe',
      issuer: 'PaisaPe',
      length: 20,
    });

    const backupCodes = this.generateBackupCodes();

    let twoFactor = await this.twoFactorModel.findOne({ userId });

    if (twoFactor) {
      twoFactor.isEnabled = true;
      twoFactor.secret = secret.base32;
      twoFactor.backupCodes = backupCodes;
      twoFactor.isVerified = false;
      await twoFactor.save();
    } else {
      twoFactor = new this.twoFactorModel({
        id: uuidv4(),
        userId,
        isEnabled: true,
        secret: secret.base32,
        backupCodes,
        isVerified: false,
      });
      await twoFactor.save();
    }

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `PaisaPe:${userId}`,
      issuer: 'PaisaPe',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      backupCodes,
      qrCodeUrl: qrCodeDataUrl,
      otpauthUrl,
    };
  }

  async disable2FA(userId: string): Promise<void> {
    await this.twoFactorModel.updateOne({ userId }, { isEnabled: false, isVerified: false });
  }

  async verify2FA(userId: string, code: string): Promise<boolean> {
    const twoFactor = await this.twoFactorModel.findOne({ userId, isEnabled: true });
    if (!twoFactor) return false;

    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (isValid) {
      if (!twoFactor.isVerified) {
        twoFactor.isVerified = true;
        await twoFactor.save();
      }
      return true;
    }

    // Check backup codes
    if (twoFactor.backupCodes.includes(code)) {
      twoFactor.backupCodes = twoFactor.backupCodes.filter(c => c !== code);
      await twoFactor.save();
      return true;
    }

    return false;
  }

  async getStatus(userId: string): Promise<any> {
    const twoFactor = await this.twoFactorModel.findOne({ userId }).select('-_id -__v -secret');
    if (!twoFactor) return { isEnabled: false, isVerified: false, backupCodesRemaining: 0 };
    return {
      isEnabled: twoFactor.isEnabled,
      isVerified: twoFactor.isVerified || false,
      backupCodesRemaining: (twoFactor.backupCodes || []).length,
    };
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
  }
}
