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
    const baseUrl = process.env.APP_URL || 'https://operator-router.preview.emergentagent.com';
    const callbackUrl = `${baseUrl}/api/webhooks/callback/${api.id}`;
    return { callbackUrl };
  }

  @Post(':id/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async testApi(@Param('id') id: string, @Body() body: { mobile?: string; operatorCode?: string; amount?: number }) {
    const apiConfig = await this.apiConfigService.findById(id);
    const obj = apiConfig.toObject();
    
    const url = `${obj.protocol}://${obj.domain}${obj.endpoint}`;
    const params = (obj.parameters || []).map((p: any) => {
      let val = p.fieldValue;
      if (p.isDynamic) {
        if (p.fieldName === 'number' || p.fieldName === 'mobile') val = body.mobile || '9999999999';
        else if (p.fieldName === 'op_code' || p.fieldName === 'operatorCode') val = body.operatorCode || 'TEST';
        else if (p.fieldName === 'amount') val = String(body.amount || 10);
        else if (p.fieldName === 'txn_id' || p.fieldName === 'clientOrderId') val = `TEST${Date.now()}`;
      }
      return { key: p.fieldName, value: val, isDynamic: p.isDynamic };
    });

    let fullUrl = url;
    if (obj.method === 'GET' || obj.requestFormat === 'query_param') {
      const qs = params.map((p: any) => `${p.key}=${encodeURIComponent(p.value)}`).join('&');
      fullUrl = qs ? `${url}?${qs}` : url;
    }

    const headers = (obj.headers || []).map((h: any) => ({ key: h.key, value: h.value }));
    
    const jsonBody: any = {};
    if (obj.method !== 'GET' && obj.requestFormat !== 'query_param') {
      params.forEach((p: any) => { jsonBody[p.key] = p.value; });
    }

    return {
      status: 'validated',
      method: obj.method,
      fullUrl,
      headers,
      requestBody: obj.method !== 'GET' ? jsonBody : null,
      parameters: params,
      requestFormat: obj.requestFormat || 'query_param',
      responseMapping: {
        successField: obj.successField || 'status',
        successValue: obj.successValue || 'Success',
        failedValue: obj.failedValue || 'Failed',
        pendingValue: obj.pendingValue || 'Pending',
        txnIdField: obj.txnIdField || 'txnid',
        balanceField: obj.balanceField || 'balance',
        messageField: obj.messageField || 'status_msg',
      },
      note: 'This shows the actual request that would be sent to the provider. No live call made.',
    };
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
