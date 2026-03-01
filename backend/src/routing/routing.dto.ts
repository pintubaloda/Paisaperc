import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';
import { UserRole } from '../common/enums';

export class CreateRoutingRuleDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsString()
  apiId: string;

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;
}
