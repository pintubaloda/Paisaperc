import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { CreateRoutingRuleDto, UpdateRoutingRuleDto } from './routing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createDto: CreateRoutingRuleDto) {
    return this.routingService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.routingService.findAll();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateRoutingRuleDto) {
    return this.routingService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.routingService.delete(id);
    return { message: 'Routing rule deleted successfully' };
  }
}
