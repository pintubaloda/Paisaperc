import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submit(@Request() req, @Body() body: { docType: string; docNumber: string; docUrl?: string }) {
    return this.kycService.submitDocument(req.user.id, body);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyDocs(@Request() req) {
    return this.kycService.getUserDocuments(req.user.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAll() {
    return this.kycService.getAll();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPending() {
    return this.kycService.getAllPending();
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserDocs(@Param('userId') userId: string) {
    return this.kycService.getUserDocuments(userId);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async verify(
    @Param('id') id: string, @Request() req,
    @Body() body: { status: string; rejectionReason?: string },
  ) {
    return this.kycService.verify(id, body.status, req.user.id, body.rejectionReason);
  }
}
