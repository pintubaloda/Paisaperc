import { Controller, Post, Get, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { RechargeService } from '../recharge/recharge.service';
import { UsersService } from '../users/users.service';
import { CreateRechargeDto } from '../recharge/recharge.dto';

@Controller('customer-api')
export class CustomerApiController {
  constructor(
    private rechargeService: RechargeService,
    private usersService: UsersService,
  ) {}

  async validateApiKey(apiKey: string): Promise<any> {
    const user = await this.usersService.findAll();
    const apiUser = user.find(u => u.apiKey === apiKey && u.role === 'api_user');
    if (!apiUser) {
      throw new UnauthorizedException('Invalid API key');
    }
    return apiUser;
  }

  @Post('recharge')
  async recharge(
    @Headers('x-api-key') apiKey: string,
    @Body() body: CreateRechargeDto & { memberId: string },
  ) {
    const user = await this.validateApiKey(apiKey);
    
    const transaction = await this.rechargeService.createRecharge(user.id, user.role, {
      operatorId: body.operatorId,
      mobile: body.mobile,
      amount: body.amount,
      circle: body.circle,
    });
    
    return {
      status: 'success',
      txnId: transaction.id,
      providerRef: transaction.providerRef,
      mobile: transaction.mobile,
      amount: transaction.amount,
      commission: transaction.commission,
    };
  }

  @Get('status/:txnId')
  async getStatus(
    @Headers('x-api-key') apiKey: string,
    @Param('txnId') txnId: string,
  ) {
    await this.validateApiKey(apiKey);
    
    const transaction = await this.rechargeService.getTransactionById(txnId);
    
    if (!transaction) {
      return { status: 'not_found', message: 'Transaction not found' };
    }
    
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
}
