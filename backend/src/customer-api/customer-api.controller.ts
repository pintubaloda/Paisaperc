import { Controller, Post, Get, Body, Param, Headers, UnauthorizedException, Req, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RechargeService } from '../recharge/recharge.service';
import { UsersService } from '../users/users.service';
import { CreateRechargeDto } from '../recharge/recharge.dto';
import { Request } from 'express';

@Controller('customer-api')
@Throttle({ default: { limit: 60, ttl: 60000 } })

@Controller('customer-api')
export class CustomerApiController {
  constructor(
    private rechargeService: RechargeService,
    private usersService: UsersService,
  ) {}

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    if (Array.isArray(forwarded)) return forwarded[0];
    return req.ip || req.socket?.remoteAddress || '';
  }

  async validateApiKey(apiKey: string, req: Request): Promise<any> {
    if (!apiKey) throw new UnauthorizedException('API key required');
    const users = await this.usersService.findAll();
    const apiUser = users.find(u => u.apiKey === apiKey && u.role === 'api_user');
    if (!apiUser) throw new UnauthorizedException('Invalid API key');

    // IP Whitelist check
    const allowedIps = apiUser.allowedIps || [];
    if (allowedIps.length > 0) {
      const clientIp = this.getClientIp(req);
      const isAllowed = allowedIps.some((ip: string) => clientIp.includes(ip) || ip === '*');
      if (!isAllowed) {
        throw new ForbiddenException(`IP ${clientIp} not in whitelist`);
      }
    }

    return apiUser;
  }

  @Post('recharge')
  async recharge(
    @Headers('x-api-key') apiKey: string,
    @Req() req: Request,
    @Body() body: CreateRechargeDto & { memberId: string },
  ) {
    const user = await this.validateApiKey(apiKey, req);
    const transaction = await this.rechargeService.createRecharge(user.id, user.role, {
      operatorId: body.operatorId,
      mobile: body.mobile,
      amount: body.amount,
      circle: body.circle,
    });
    return {
      status: transaction.status,
      txnId: transaction.id,
      providerRef: transaction.providerRef,
      mobile: transaction.mobile,
      amount: transaction.amount,
      commission: transaction.commission,
      responseCode: transaction.responseCode,
      responseMessage: transaction.responseMessage,
    };
  }

  @Get('status/:txnId')
  async getStatus(
    @Headers('x-api-key') apiKey: string,
    @Req() req: Request,
    @Param('txnId') txnId: string,
  ) {
    await this.validateApiKey(apiKey, req);
    const transaction = await this.rechargeService.getTransactionById(txnId);
    if (!transaction) return { status: 'not_found', message: 'Transaction not found' };
    return {
      txnId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      mobile: transaction.mobile,
      providerRef: transaction.providerRef,
      responseCode: transaction.responseCode,
      responseMessage: transaction.responseMessage,
    };
  }

  @Get('balance')
  async getBalance(
    @Headers('x-api-key') apiKey: string,
    @Req() req: Request,
  ) {
    const user = await this.validateApiKey(apiKey, req);
    const wallet = await this.usersService.getWalletBalance(user.id);
    return { balance: wallet };
  }
}
