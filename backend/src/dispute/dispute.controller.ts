import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.disputeService.findAll();
  }

  @Get('unresolved')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findUnresolved() {
    return this.disputeService.findUnresolved();
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resolve(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { action: string; note: string },
  ) {
    return this.disputeService.resolve(id, body.action, body.note, req.user.id);
  }
}
