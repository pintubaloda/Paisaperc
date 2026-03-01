import { Controller, Get, UseGuards, Request, Query, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.id);
  }

  @Get('ledger')
  @UseGuards(JwtAuthGuard)
  async getLedger(@Request() req, @Query('limit') limit?: string) {
    return this.walletService.getLedger(req.user.id, limit ? parseInt(limit) : 100);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllWallets() {
    return this.walletService.getAllWallets();
  }

  @Get('all-ledgers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllLedgers(@Query('limit') limit?: string) {
    return this.walletService.getAllLedgerEntries(limit ? parseInt(limit) : 1000);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserWallet(@Param('userId') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('user/:userId/ledger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserLedger(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.walletService.getLedger(userId, limit ? parseInt(limit) : 100);
  }
}
