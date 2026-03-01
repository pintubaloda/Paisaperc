import { IsEnum, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { UserRole, CommissionType, ServiceType } from '../common/enums';

export class CreateCommissionDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  operatorId: string;

  @IsOptional()
  @IsEnum(ServiceType)
  service?: ServiceType;

  @IsEnum(CommissionType)
  commissionType: CommissionType;

  @IsNumber()
  commissionValue: number;
}

export class UpdateCommissionDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  service?: ServiceType;

  @IsOptional()
  @IsEnum(CommissionType)
  commissionType?: CommissionType;

  @IsOptional()
  @IsNumber()
  commissionValue?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
