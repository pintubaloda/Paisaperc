import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { RechargeService } from './recharge.service';
import { TxnEventService } from './txn-event.service';
import { CreateRechargeDto } from './recharge.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('recharge')
export class RechargeController {
  constructor(
    private readonly rechargeService: RechargeService,
    private readonly txnEventService: TxnEventService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async recharge(@Request() req, @Body() body: CreateRechargeDto) {
    return this.rechargeService.createRecharge(req.user.id, req.user.role, body);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async myTransactions(@Request() req, @Query('limit') limit: string) {
    return this.rechargeService.getTransactions(req.user.id, parseInt(limit) || 100);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async allTransactions(@Query('limit') limit: string) {
    return this.rechargeService.getAllTransactions(parseInt(limit) || 1000);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async stats() {
    return this.rechargeService.getStats();
  }

  @Get('failed/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async failedTransactions(@Query('limit') limit: string) {
    return this.rechargeService.getFailedTransactions(parseInt(limit) || 100);
  }

  @Get('pending/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async pendingTransactions(@Query('limit') limit: string) {
    return this.rechargeService.getPendingTransactions(parseInt(limit) || 100);
  }

  @Get('timeline/:id')
  @UseGuards(JwtAuthGuard)
  async getTimeline(@Param('id') id: string) {
    return this.txnEventService.getTimeline(id);
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  async transactionDetail(@Param('id') id: string) {
    return this.rechargeService.getTransactionDetail(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getTransaction(@Param('id') id: string) {
    return this.rechargeService.getTransactionById(id);
  }

  @Post(':id/check-status')
  @UseGuards(JwtAuthGuard)
  async checkStatus(@Param('id') id: string) {
    return this.rechargeService.checkPendingStatus(id);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  async retry(@Param('id') id: string) {
    return this.rechargeService.retryFailedTransaction(id);
  }

  @Post(':id/retry-with-api')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async retryWithApi(@Param('id') id: string, @Body() body: { apiId: string }) {
    return this.rechargeService.retryWithApi(id, body.apiId);
  }

  @Post(':id/change-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async changeStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { status: string; note: string },
  ) {
    return this.rechargeService.adminChangeStatus(id, body.status, body.note, req.user.id);
  }

  @Post('bulk-resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkResolve() {
    return this.rechargeService.bulkResolveStatus();
  }

  @Post('sandbox-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sandboxTest(@Body() body: { userId: string; count: number; operators: string[]; tpm: number }) {
    return this.rechargeService.sandboxBulkTest(body.userId, body.count, body.operators, body.tpm);
  }

  @Post('run-sandbox-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async runSandboxTest(@Body() body: { userId: string; count: number; operators: string[]; tpm: number }) {
    return this.rechargeService.sandboxBulkTest(body.userId, body.count, body.operators, body.tpm);
  }
}
