import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { CreateRechargeDto } from './recharge.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('recharge')
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createDto: CreateRechargeDto) {
    return this.rechargeService.createRecharge(req.user.id, req.user.role, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyTransactions(@Request() req, @Query('limit') limit?: string) {
    return this.rechargeService.getTransactions(req.user.id, limit ? parseInt(limit) : 100);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllTransactions(@Query('limit') limit?: string) {
    return this.rechargeService.getAllTransactions(limit ? parseInt(limit) : 1000);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.rechargeService.getStats();
  }

  @Get('failed/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getFailedTransactions(@Query('limit') limit?: string) {
    return this.rechargeService.getFailedTransactions(limit ? parseInt(limit) : 100);
  }

  @Get('pending/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingTransactions(@Query('limit') limit?: string) {
    return this.rechargeService.getPendingTransactions(limit ? parseInt(limit) : 100);
  }

  @Post('sandbox-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sandboxBulkTest(@Body() body: { userId: string; count: number; operators: string[]; tpm?: number }) {
    return this.rechargeService.sandboxBulkTest(body.userId, body.count || 10, body.operators || [], body.tpm || 60);
  }

  @Post(':id/check-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkStatus(@Param('id') id: string) {
    return this.rechargeService.checkPendingStatus(id);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async retryTransaction(@Param('id') id: string) {
    return this.rechargeService.retryFailedTransaction(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getTransaction(@Param('id') id: string) {
    return this.rechargeService.getTransactionById(id);
  }
}
