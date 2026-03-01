import { IsString, IsEnum, IsArray, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, APIMethod } from '../common/enums';

export class APIParameterDto {
  @IsString()
  fieldName: string;

  @IsString()
  fieldValue: string;

  @IsBoolean()
  isDynamic: boolean;
}

export class APIHeaderDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class CreateAPIDto {
  @IsString()
  name: string;

  @IsEnum(ServiceType)
  apiType: ServiceType;

  @IsString()
  protocol: string;

  @IsString()
  domain: string;

  @IsString()
  endpoint: string;

  @IsEnum(APIMethod)
  method: APIMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => APIParameterDto)
  parameters: APIParameterDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => APIHeaderDto)
  headers?: APIHeaderDto[];

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  @IsString()
  requestFormat?: string;

  @IsOptional()
  @IsString()
  successField?: string;

  @IsOptional()
  @IsString()
  successValue?: string;

  @IsOptional()
  @IsString()
  failedValue?: string;

  @IsOptional()
  @IsString()
  pendingValue?: string;

  @IsOptional()
  @IsString()
  txnIdField?: string;

  @IsOptional()
  @IsString()
  balanceField?: string;

  @IsOptional()
  @IsString()
  messageField?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSandbox?: boolean;

  @IsOptional()
  @IsString()
  statusCheckEndpoint?: string;

  @IsOptional()
  @IsString()
  statusCheckMethod?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => APIParameterDto)
  statusCheckParams?: APIParameterDto[];

  @IsOptional()
  @IsString()
  callbackToken?: string;

  @IsOptional()
  @IsString()
  sampleRequest?: string;

  @IsOptional()
  @IsString()
  sampleResponse?: string;

  @IsOptional()
  @IsNumber()
  successRate?: number;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsArray()
  operatorCodes?: any[];

  @IsOptional()
  @IsArray()
  responseMappings?: any[];
}

export class UpdateAPIDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  apiType?: ServiceType;

  @IsOptional()
  @IsString()
  protocol?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsEnum(APIMethod)
  method?: APIMethod;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  successRate?: number;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsArray()
  parameters?: any[];

  @IsOptional()
  @IsArray()
  headers?: any[];

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  @IsString()
  requestFormat?: string;

  @IsOptional()
  @IsString()
  successField?: string;

  @IsOptional()
  @IsString()
  successValue?: string;

  @IsOptional()
  @IsString()
  failedValue?: string;

  @IsOptional()
  @IsString()
  pendingValue?: string;

  @IsOptional()
  @IsString()
  txnIdField?: string;

  @IsOptional()
  @IsString()
  balanceField?: string;

  @IsOptional()
  @IsString()
  messageField?: string;

  @IsOptional()
  @IsBoolean()
  isSandbox?: boolean;

  @IsOptional()
  @IsString()
  statusCheckEndpoint?: string;

  @IsOptional()
  @IsString()
  statusCheckMethod?: string;

  @IsOptional()
  @IsArray()
  statusCheckParams?: any[];

  @IsOptional()
  @IsString()
  callbackToken?: string;

  @IsOptional()
  @IsString()
  sampleRequest?: string;

  @IsOptional()
  @IsString()
  sampleResponse?: string;

  @IsOptional()
  @IsArray()
  operatorCodes?: any[];

  @IsOptional()
  @IsArray()
  responseMappings?: any[];
}
