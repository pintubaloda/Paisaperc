import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
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

  @Get('all-ledgers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllLedgers(@Query('limit') limit?: string) {
    return this.walletService.getAllLedgerEntries(limit ? parseInt(limit) : 1000);
  }
}
