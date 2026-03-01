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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getTransaction(@Param('id') id: string) {
    return this.rechargeService.getTransactionById(id);
  }
}
