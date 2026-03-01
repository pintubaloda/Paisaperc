import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { RechargeService } from '../recharge/recharge.service';
import { WalletService } from '../wallet/wallet.service';
import { UsersService } from '../users/users.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private rechargeService: RechargeService,
    private walletService: WalletService,
    private usersService: UsersService,
  ) {}

  @Get('dashboard-stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Request() req) {
    const stats = await this.rechargeService.getStats();
    const wallet = await this.walletService.getWallet(req.user.id);
    
    return {
      ...stats,
      walletBalance: wallet.balance,
    };
  }

  @Get('admin-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminDashboard() {
    const stats = await this.rechargeService.getStats();
    const users = await this.usersService.findAll();
    
    return {
      ...stats,
      totalUsers: users.length,
    };
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactionReport(@Request() req, @Query('limit') limit?: string) {
    if (req.user.role === UserRole.ADMIN) {
      return this.rechargeService.getAllTransactions(limit ? parseInt(limit) : 1000);
    }
    return this.rechargeService.getTransactions(req.user.id, limit ? parseInt(limit) : 100);
  }

  @Get('ledger')
  @UseGuards(JwtAuthGuard)
  async getLedgerReport(@Request() req, @Query('limit') limit?: string) {
    if (req.user.role === UserRole.ADMIN) {
      return this.walletService.getAllLedgerEntries(limit ? parseInt(limit) : 1000);
    }
    return this.walletService.getLedger(req.user.id, limit ? parseInt(limit) : 100);
  }
}
