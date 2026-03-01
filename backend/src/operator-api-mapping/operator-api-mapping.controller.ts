import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OperatorAPIMappingService } from './operator-api-mapping.service';
import { CreateMappingDto, UpdateMappingDto } from './operator-api-mapping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('operator-api-mapping')
export class OperatorAPIMappingController {
  constructor(private readonly mappingService: OperatorAPIMappingService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createDto: CreateMappingDto) {
    return this.mappingService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.mappingService.findAll();
  }

  @Get('operator/:operatorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findByOperator(@Param('operatorId') operatorId: string) {
    return this.mappingService.findByOperator(operatorId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateMappingDto) {
    return this.mappingService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.mappingService.delete(id);
    return { message: 'Mapping deleted successfully' };
  }
}
