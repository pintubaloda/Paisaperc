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
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAPIDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  parameters?: APIParameterDto[];
}
