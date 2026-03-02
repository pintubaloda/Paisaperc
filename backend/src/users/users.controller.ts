import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateKycDto } from './user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    const { password, ...userObj } = user;
    return userObj;
  }

  @Post('kyc')
  @UseGuards(JwtAuthGuard)
  async updateKyc(@Request() req, @Body() kycDto: UpdateKycDto) {
    return this.usersService.updateKyc(req.user.id, kycDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleUserStatus(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.usersService.updateUser(id, updateData);
  }

  @Post(':id/adjust-wallet')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adjustWallet(@Param('id') id: string, @Body() body: { amount: number; type: string; remarks: string }) {
    return this.usersService.adjustWallet(id, body.amount, body.type, body.remarks);
  }
}
