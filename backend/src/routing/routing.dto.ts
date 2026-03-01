import { IsEnum, IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { UserRole } from '../common/enums';

export class CreateRoutingRuleDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsArray()
  @IsString({ each: true })
  apiPriority: string[];

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;
}

export class UpdateRoutingRuleDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  apiPriority?: string[];

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
