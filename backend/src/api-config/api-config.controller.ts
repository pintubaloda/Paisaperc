import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiConfigService } from './api-config.service';
import { CreateAPIDto, UpdateAPIDto } from './api-config.dto';
import { UpdateOperatorCodesDto, UpdateResponseMappingsDto } from './api-config-enhanced.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('api-config')
export class ApiConfigController {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createDto: CreateAPIDto) {
    return this.apiConfigService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.apiConfigService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const api = await this.apiConfigService.findById(id);
    const obj = api.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  @Get(':id/callback-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getCallbackUrl(@Param('id') id: string) {
    const api = await this.apiConfigService.findById(id);
    const callbackUrl = `${process.env.REACT_APP_BACKEND_URL || 'https://operator-router.preview.emergentagent.com'}/api/webhooks/callback/${api.id}/${api['callbackToken']}`;
    return { callbackUrl, token: api['callbackToken'] };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateAPIDto) {
    return this.apiConfigService.update(id, updateDto);
  }

  @Put(':id/operator-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOperatorCodes(@Param('id') id: string, @Body() dto: UpdateOperatorCodesDto) {
    return this.apiConfigService.updateOperatorCodes(id, dto.operatorCodes);
  }

  @Put(':id/response-mappings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateResponseMappings(@Param('id') id: string, @Body() dto: UpdateResponseMappingsDto) {
    return this.apiConfigService.updateResponseMappings(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.apiConfigService.delete(id);
    return { message: 'API deleted successfully' };
  }
}
