import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {}

  async enable2FA(userId: string): Promise<any> {
    const secret = speakeasy.generateSecret({
      name: 'PaisaPe',
      issuer: 'PaisaPe',
      length: 20,
    });

    const backupCodes = this.generateBackupCodes();

    await this.prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        isEnabled: true,
        secret: secret.base32,
        backupCodes,
        isVerified: false,
      },
      create: {
        userId,
        isEnabled: true,
        secret: secret.base32,
        backupCodes,
        isVerified: false,
      },
    });

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
    await this.prisma.twoFactorAuth.updateMany({
      where: { userId },
      data: { isEnabled: false, isVerified: false },
    });
  }

  async verify2FA(userId: string, code: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({ where: { userId } });
    if (!twoFactor || !twoFactor.isEnabled) return false;

    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret || '',
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (isValid) {
      if (!twoFactor.isVerified) {
        await this.prisma.twoFactorAuth.update({
          where: { userId },
          data: { isVerified: true },
        });
      }
      return true;
    }

    if ((twoFactor.backupCodes || []).includes(code)) {
      await this.prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          backupCodes: (twoFactor.backupCodes || []).filter((c) => c !== code),
        },
      });
      return true;
    }

    return false;
  }

  async getStatus(userId: string): Promise<any> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({ where: { userId } });
    if (!twoFactor) return { isEnabled: false, isVerified: false, backupCodesRemaining: 0 };

    return {
      isEnabled: twoFactor.isEnabled,
      isVerified: twoFactor.isVerified || false,
      backupCodesRemaining: (twoFactor.backupCodes || []).length,
    };
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
  }
}
