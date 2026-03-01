import { Controller, Post, Delete, Get, Body, UseGuards, Request } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('two-factor')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('enable')
  @UseGuards(JwtAuthGuard)
  async enable(@Request() req) {
    return this.twoFactorService.enable2FA(req.user.id);
  }

  @Delete('disable')
  @UseGuards(JwtAuthGuard)
  async disable(@Request() req) {
    await this.twoFactorService.disable2FA(req.user.id);
    return { message: '2FA disabled successfully' };
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@Request() req, @Body() body: { code: string }) {
    const isValid = await this.twoFactorService.verify2FA(req.user.id, body.code);
    return { valid: isValid };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req) {
    return this.twoFactorService.getStatus(req.user.id);
  }
}
