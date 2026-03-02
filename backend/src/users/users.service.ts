import { Injectable, ConflictException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { RegisterDto, UpdateKycDto } from './user.dto';
import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WalletService)) private walletService: WalletService,
  ) {}

  private sanitizeUser<T extends { password?: string; apiSecret?: string }>(user: T) {
    const { password, apiSecret, ...safeUser } = user;
    return safeUser;
  }

  async create(registerDto: RegisterDto): Promise<any> {
    const existing = await this.prisma.user.findUnique({ where: { email: registerDto.email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
      password: hashedPassword,
      id: uuidv4(),
        apiKey: registerDto.role === UserRole.API_USER ? uuidv4() : null,
        apiSecret: registerDto.role === UserRole.API_USER ? uuidv4() : null,
      },
    });

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        role: true,
        kycStatus: true,
        isActive: true,
        panCard: true,
        aadhaarCard: true,
        gstNumber: true,
        kycVerifiedBy: true,
        kycVerifiedAt: true,
        kycRejectionReason: true,
        kycVerificationStatus: true,
        panDocUrl: true,
        aadhaarDocUrl: true,
        gstDocUrl: true,
        apiKey: true,
        allowedIps: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  async updateKyc(userId: string, kycDto: UpdateKycDto): Promise<any> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { ...kycDto, kycStatus: true },
      });
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async toggleUserStatus(userId: string): Promise<any> {
    const user = await this.findById(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return this.sanitizeUser(updated);
  }

  async updateUser(userId: string, updateData: any): Promise<any> {
    const allowedFields = ['name', 'mobile', 'role', 'isActive', 'kycStatus', 'panCard', 'aadhaarCard', 'gstNumber', 'allowedIps'];
    const sanitized: any = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        sanitized[key] = updateData[key];
      }
    }
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: sanitized,
      });
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async adjustWallet(userId: string, amount: number, type: string, remarks: string): Promise<any> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (type === 'credit') {
      await this.walletService.addBalance(userId, amount, `Admin: ${remarks}`);
    } else if (type === 'debit') {
      await this.walletService.deductBalance(userId, amount, `Admin: ${remarks}`, uuidv4());
    } else {
      throw new NotFoundException('Invalid type. Must be credit or debit');
    }
    const wallet = await this.walletService.getWallet(userId);
    return { message: `Wallet ${type} of ${amount} successful`, balance: wallet.balance };
  }

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.walletService.getWallet(userId);
    return wallet.balance;
  }
}
